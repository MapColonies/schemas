import fsPromise from 'node:fs/promises';
import fs from 'node:fs';
import AjvModule from 'ajv';
import get from 'just-safe-get';
import path, { join } from 'node:path';
import { presult, result, setErrorsOnAction, printErrorsToConsole, FileError } from './util/index.js';
import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<{
  directory: string;
  file: string;
}>();

const errors: FileError[] = [];

const refsMap = new Map<string, Set<string>>();

function handleError(msg: string, id?: string): void {
  const fileContext = asyncLocalStorage.getStore();

  let directory = fileContext?.directory;
  let file = fileContext?.file;

  if (id) {
    const lastSlashIndex = id.lastIndexOf('/');
    directory = path.join('schemas', id.substring(0, lastSlashIndex));

    const fileNameStart = id.substring(lastSlashIndex + 1);
    if (fs.existsSync(path.join(directory, `${fileNameStart}.schema.json`))) {
      file = `${fileNameStart}.schema.json`;
    } else if (fs.existsSync(path.join(directory, `${fileNameStart}.schema.ts`))) {
      file = `${fileNameStart}.schema.ts`;
    } else {
      throw new Error(`Could not find the file ${fileNameStart} referenced in the error`);
    }
  }

  errors.push({
    file: file ?? undefined,
    directory: directory ?? undefined,
    error: msg,
  });
}

function validateRef(ref: string): boolean {
  // https://mapcolonies.com/common/port/v2
  if (!ref.startsWith('https://mapcolonies.com/')) {
    handleError(`Error validating ${ref}: $ref is incorrect, it should be in the following format: https://mapcolonies.com/directory/version`);
    return false;
  }
  const refPath = ref.substring(24);
  const basePath = path.join('schemas', refPath);
  if (!fs.existsSync(basePath + '.schema.json') && !fs.existsSync(basePath + '.schema.ts')) {
    handleError(`Error validating ${ref}: $ref is incorrect, could not find the file referenced`);
    return false;
  }
  return true;
}

function validateRefs(schema: any) {
  let keys = Object.keys(schema);

  for (const key of keys) {
    const value = get(schema, key);

    if (key.endsWith('$ref')) {
      // we assume that the $ref and $id are defined
      const refValue = (value as string).substring(24);
      const id = schema.$id.substring(24) as string;

      const isValidated = validateRef(get(schema, key));

      if (isValidated) {
        const refsSet = refsMap.get(id);
        if (refsSet) {
          refsSet.add(refValue);
        } else {
          refsMap.set(id, new Set([refValue]));
        }
      }
    }

    if (schema !== Object(schema)) {
      continue;
    }

    if (Array.isArray(value)) {
      keys.push(...value.map((_, i) => `${key}[${i}]`));
    }

    if (typeof value === 'object') {
      keys.push(...Object.keys(value).map((k) => `${key}.${k}`));
    }
  }
}

async function validateSchema(schema: any, file: string) {
  const ajv = new AjvModule.default();
  
  const res = ajv.validateSchema(schema);
  if (!res) {
    return handleError(`Error validating file: ${ajv.errorsText()}`);
  }

  const fileWithoutSchema = file.substring(8);

  if (schema.$id !== 'https://mapcolonies.com/' + fileWithoutSchema.substring(0, fileWithoutSchema.indexOf('.schema'))) {
    return handleError(`Error validating file: $id is incorrect, it should be in the following format: https://mapcolonies.com/directory/version`);
  }

  validateRefs(schema);
}

async function validateJsonFile(file: string) {
  const content = await fsPromise.readFile(file, { encoding: 'utf-8' });
  const [error, schema] = result(JSON.parse, content);
  if (error) {
    handleError(`Error parsing file: ${error.message}`);
    return;
  }

  await validateSchema(schema, file);
}

async function validateTsFile(file: string) {
  const [error, schema] = await presult(import(path.join('..', file)));
  if (error) {
    return handleError(`Error importing file: ${error.message}`);
  }
   if (!schema.default) {
    return handleError(`Error validating file: default export is missing`);
   }

  await validateSchema(schema.default, file);
}

const directories = ['schemas'];

for (const directory of directories) {
  let files = await fsPromise.readdir(directory, { withFileTypes: true });

  // sort all files so that we can validate the order and filter out any markdown files
  files = files.filter((file) => path.extname(file.name) !== '.md').sort((a, b) => a.name.localeCompare(b.name));

  // if all files are directories, we just add them to the list of directories to check
  if (files.every((file) => file.isDirectory())) {
    directories.push(...files.map((file) => path.join(directory, file.name)));
    continue;
  }

  let fileOrderCounter = 1;

  for (const file of files) {
    await asyncLocalStorage.run({ directory, file: file.name }, async () => {
      // the correct structure is is either only directories or only files, so if its not a file at this stage, it is an error
      if (!file.isFile()) {
        return handleError(`Found a directory when a file was expected`);
      }

      const fileNameParts = file.name.split('.');

      // check that the file name contains the schema keyword
      if (fileNameParts.length !== 3 || fileNameParts[1] !== 'schema') {
        return handleError(`file was not expected in this location`);
      }

      // check that the file is in the correct order
      if (fileNameParts[0] !== `v${fileOrderCounter++}`) {
        return handleError(`schema is not in the correct order, expected v${fileOrderCounter - 1} but got ${fileNameParts[0]}`);
      }

      const filePath = path.join(directory, file.name);
      switch (fileNameParts[2]) {
        case 'json':
          await validateJsonFile(filePath);
          break;
        case 'ts':
          await validateTsFile(filePath);
          break;
        default:
          return handleError(`Found a file that was not expected ${filePath}`);
      }
    });
  }
}

// helper function for the cyclic reference check
function isRefCircular(refsToCheck: Set<string>, originalId: string): boolean {
  for (const ref of refsToCheck) {
    if (ref === originalId) {
      return true;
    }
    if (refsMap.get(ref) && isRefCircular(refsMap.get(ref)!, originalId)) {
      return true;
    }
  }
  return false;
}

// check for circular references
for (const [id, parentRefsSet] of refsMap.entries()) {
  for (const ref of parentRefsSet) {
    if (refsMap.get(ref) && isRefCircular(refsMap.get(ref)!, id)) {
      handleError(`Error validating ${id}: circular reference detected with ${ref}`, id);
      break;
    }
  }
}

if (errors.length > 0) {
  if (process.env.GITHUB_ACTIONS) {
    setErrorsOnAction(errors);
  }
  printErrorsToConsole(errors);
  process.exit(1);
}

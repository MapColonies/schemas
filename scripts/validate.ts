import fsPromise from 'node:fs/promises';
import fs from 'node:fs';
import AjvModule from 'ajv';
import path from 'node:path';
import { $RefParser } from '@apidevtools/json-schema-ref-parser';
import { presult, result, setErrorsOnAction, printErrorsToConsole, FileError } from './util/index.js';
import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<{
  directory: string;
  file: string;
}>();


const errors: FileError[] = [];

// function to add all errors to the errors array with location context
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

async function validateRefs(schema: string) {
  const parser = new $RefParser();

  const resolver = {
    order: 1,
    canRead: /^https:\/\/mapcolonies.com\/.*/,
    read: async (file: { url: string; hash: string; extension: string }) => {
      const subPath = file.url.split('https://mapcolonies.com/')[1];

      if (fs.existsSync(path.join('schemas', subPath + '.schema.json'))) {
        return fsPromise.readFile(path.join('schemas', subPath + '.schema.json'), { encoding: 'utf-8' });
      }

      if (fs.existsSync(path.join('schemas', subPath + '.schema.ts'))) {
        return (await import(path.join('..', 'schemas', subPath + '.schema.ts'))).default;
      }

      throw new Error(`Could not find the file ${subPath} referenced in the error it wasn't TS or JSON`);
    },
  };

  const [error, refsObj] = await presult(
    parser.resolve(schema, {
      dereference: {
        circular: false,
      },
      resolve: {
        file: false,
        http: false,
        mapcolonies: resolver,
      },
    })
  );

  if (error) {
    return handleError(`Error resolving refs: ${error.message}`);
  }

  // here we check if the refs are circular. if more than one schema contains the same id, it is considered circular
  const refs = Object.values(refsObj.values());
  const id = refs[0].$id;

  let idCount = 0;

  for (const ref of refs) {
    if (ref.$id === id) {
      idCount++;
    }
  }

  if (refsObj.circular || idCount > 1) {
    handleError(`Error validating refs: circular reference detected`);
  }
}

async function validateSchema(schema: any, file: string) {
  const ajv = new AjvModule.default();

  // validate the schema against the json schema schema
  const res = ajv.validateSchema(schema);
  if (!res) {
    return handleError(`Error validating file: ${ajv.errorsText()}`);
  }

  const fileWithoutSchema = file.substring(8, file.indexOf('.schema'));
  const normalizedIdSubPath = fileWithoutSchema.replaceAll(path.win32.sep, path.posix.sep);

  // we check that id is in the following format https://mapcolonies.com/directory/version
  if (!schema.$id || !new RegExp(`https://mapcolonies.com/${normalizedIdSubPath}(#.*)?`).test(schema.$id) || schema.$id.includes('..')) {
    return handleError(`Error validating file: $id is incorrect, it should be in the following format: https://mapcolonies.com/directory/version`);
  }

  await validateRefs(schema);
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

if (errors.length > 0) {
  if (process.env.GITHUB_ACTIONS) {
    setErrorsOnAction(errors);
  }
  printErrorsToConsole(errors);
  process.exit(1);
}

console.log('All schemas are valid');

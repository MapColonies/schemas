import fsPromise from 'node:fs/promises';
import fs from 'node:fs';
import * as posixPath from 'node:path/posix';
import * as path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import { betterAjvErrors } from '@apideck/better-ajv-errors';
import * as configsSchema from '../schemas/configs.schema.json' assert { type: 'json' };
import AjvModule from 'ajv';
import { ErrorHandler } from '../util/errorHandling.mjs';
import { listConfigRefs, replaceRefs, validateConfig } from './core.mjs';

export type ConfigFile = {
  directory: string;
  fileName: string;
};

const fileAsyncStorage = new AsyncLocalStorage<{
  configFilePath: string;
  schemaPath: string;
  schemaVersion: number;
  handleError: (msg: string) => void;
  schema?: any;
  configs?: configInstance[];
}>();

const configAsyncStorage = new AsyncLocalStorage<{ configName: string; configValue: any }>();

type configInstance = {
  name: string;
  value: any;
};

const configsFileValidator = new AjvModule.default({
  allErrors: true,
}).compile(configsSchema);

const seenConfigs = new Map<string, any>();

async function validateConfigInstance() {
  const fileContext = fileAsyncStorage.getStore();
  if (!fileContext) {
    throw new Error('Context not initialized properly');
  }

  const schemaPath = path.join(path.dirname(fileContext.configFilePath), `v${fileContext.schemaVersion}.schema.json`);

  const schemaContent = await fsPromise.readFile(schemaPath, 'utf-8');
  fileContext.schema = JSON.parse(schemaContent);

  const configs = JSON.parse(fs.readFileSync(fileContext.configFilePath, 'utf-8')) as configInstance[];

  for (const config of configs) {
    await configAsyncStorage.run({ configName: config.name, configValue: config.value }, async () => {
      await runValidators(configInstanceValidators);
    });
  }
}

function listAllRefs(config: any): Parameters<typeof replaceRefs>[1] {
  const refNames = new Map<string, 'latest' | 1>();

  function inner(value: any) {
    const refList = listConfigRefs(value);

    if (refList.length === 0) {
      return;
    }

    for (const ref of refList) {
      const config = seenConfigs.get(ref.configName);
      if (!config) {
        throw new Error(`The config ${ref.configName} does not exist`);
      }
      refNames.set(ref.configName, ref.version);
      inner(config);
    }
  }

  inner(config);

  const result: Parameters<typeof replaceRefs>[1] = [];

  for (const [configName, version] of refNames.entries()) {
    result.push({ configName, config: seenConfigs.get(configName), version });
  }

  return result;
}

async function forEachConfigFileWithContext<args extends unknown[]>(
  configFiles: ConfigFile[],
  handleError: (msg: string) => void,
  action: (...args: args) => Promise<void>,
  ...args: args
) {
  for (const configFile of configFiles) {
    const fileNameParts = configFile.fileName.split('.');
    const schemaPath = posixPath.join(configFile.directory, `${fileNameParts[0]}.schema.json`);
    const configFilePath = path.join(configFile.directory, configFile.fileName);

    await fileAsyncStorage.run({ schemaPath, schemaVersion: parseInt(fileNameParts[0].substring(1)), configFilePath, handleError }, async () => {
      await action(...args);
    });
  }
}

async function runValidators(validators: (() => Promise<boolean>)[]) {
  for (const validator of validators) {
    if (!(await validator())) {
      return;
    }
  }
}

//#region file validators
async function validateSchemaExists(): Promise<boolean> {
  const context = fileAsyncStorage.getStore();
  if (!context) {
    throw new Error('Context not initialized properly');
  }

  const schemaPath = path.join(path.dirname(context.configFilePath), `v${context.schemaVersion}.schema.json`);

  if (!fs.existsSync(schemaPath)) {
    context.handleError(`Schema file matching the config file does not exist`);
    return false;
  }

  const schemaContent = await fsPromise.readFile(schemaPath, 'utf-8');
  context.schema = JSON.parse(schemaContent);
  delete context.schema.$id;

  return true;
}

async function loadAndValidateConfigFiles(): Promise<boolean> {
  const context = fileAsyncStorage.getStore();
  if (!context) {
    throw new Error('Context not initialized properly');
  }

  try {
    const fileContent = await fsPromise.readFile(context.configFilePath, 'utf-8');
    const parsedContent = JSON.parse(fileContent);
    const res = configsFileValidator(parsedContent);

    if (!res) {
      const betterError = betterAjvErrors({
        data: parsedContent,
        errors: configsFileValidator.errors,
        schema: configsSchema,
      });
      context.handleError(betterError[0].message);
      return false;
    }

    context.configs = parsedContent as configInstance[];

    return true;
  } catch (error) {
    if (error instanceof Error) {
      context.handleError('failed loading and validating config file with the error: ' + error.message);
      return false;
    }
    throw error;
  }
}

async function validateConfigNames(): Promise<boolean> {
  const fileContext = fileAsyncStorage.getStore();
  if (!fileContext || !fileContext.configs) {
    throw new Error('Context not initialized properly');
  }

  for (const { name, value } of fileContext.configs) {
    if (seenConfigs.has(name)) {
      fileContext.handleError(`Config name ${name} is not unique`);
      return false;
    }
    seenConfigs.set(name, value);
  }

  return true;
}

const configFileValidators: (() => Promise<boolean>)[] = [validateSchemaExists, loadAndValidateConfigFiles, validateConfigNames];
//#endregion

//#region instance validators
async function validateAndReplaceRefs(): Promise<boolean> {
  const fileContext = fileAsyncStorage.getStore();
  const configContext = configAsyncStorage.getStore();
  if (!configContext || !fileContext) {
    throw new Error('Context not initialized properly');
  }

  try {
    const refsList = listAllRefs(configContext.configValue);
    if (refsList.length === 0) {
      return true;
    }
    replaceRefs(configContext.configValue, refsList);

    return true;
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }
    fileContext.handleError(error.message);
    return false;
  }
}

async function validateConfigValues(): Promise<boolean> {
  const fileContext = fileAsyncStorage.getStore();
  const configContext = configAsyncStorage.getStore();
  if (!configContext || !fileContext || !fileContext.schema) {
    throw new Error('Context not initialized properly');
  }

  const res = await validateConfig(configContext.configValue, fileContext.schema);

  if (!res[0]) {
    fileContext.handleError(res[1]);
    return false;
  }
  return true;
}

const configInstanceValidators: (() => Promise<boolean>)[] = [validateAndReplaceRefs, validateConfigValues];
//#endregion

export async function validateConfigs(configFiles: ConfigFile[], errorHandler: ErrorHandler): Promise<void> {
  function handleError(msg: string): void {
    const fileActiveContext = fileAsyncStorage.getStore();
    const configActiveContext = configAsyncStorage.getStore();

    if (!fileActiveContext) {
      throw new Error('Context not initialized properly');
    }

    const prefix = configActiveContext ? `config ${configActiveContext.configName} - ` : '';

    errorHandler.addError({
      file: path.basename(fileActiveContext.configFilePath),
      directory: path.dirname(fileActiveContext.configFilePath),
      error: prefix + msg,
    });
  }

  await forEachConfigFileWithContext(configFiles, handleError, runValidators, configFileValidators);
  await forEachConfigFileWithContext(configFiles, handleError, validateConfigInstance);
}

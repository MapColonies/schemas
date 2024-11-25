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

  return true;
}

const seenConfigs = new Map<string, any>();

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

async function validateConfigFile(configFile: ConfigFile, handleError: (msg: string) => void) {
  const fileNameParts = configFile.fileName.split('.');
  const schemaPath = posixPath.join(configFile.directory, `${fileNameParts[0]}.schema.json`);
  const configFilePath = path.join(configFile.directory, configFile.fileName);
  await fileAsyncStorage.run({ schemaPath, schemaVersion: parseInt(fileNameParts[0].substring(1)), configFilePath, handleError }, async () => {
    for (const validator of configFileValidators) {
      if (!(await validator())) {
        return;
      }
    }

    const res = validateConfigNames();

    if (!res) {
      return;
    }

    const fileContext = fileAsyncStorage.getStore();
    if (!fileContext || !fileContext.configs) {
      throw new Error('Context not initialized properly');
    }

    for (const config of fileContext.configs) {
      await validateConfigInstance(config);
    }
  });
}

async function validateConfigInstance(config: configInstance) {
  await configAsyncStorage.run({ configName: config.name, configValue: config.value }, async () => {
    for (const validator of configInstanceValidators) {
      if (!(await validator())) {
        return;
      }
    }
  });
}

function listAllRefs(config: any): Parameters<typeof replaceRefs>[1] {
  const refNames = new Set<string>();

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
      refNames.add(ref.configName);
      inner(config);
    }
  }

  inner(config);

  const result: Parameters<typeof replaceRefs>[1] = [];

  for (const configName of refNames.values()) {
    result.push({ configName, config: seenConfigs.get(configName), version: 'latest' });
  }

  return result;
}

async function validateAndReplaceRefs(): Promise<boolean> {
  const fileContext = fileAsyncStorage.getStore();
  const configContext = configAsyncStorage.getStore();
  if (!configContext || !fileContext) {
    throw new Error('Context not initialized properly');
  }

  try {
    const refsList = listAllRefs(configContext.configValue);
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

const configFileValidators: (() => Promise<boolean>)[] = [validateSchemaExists, loadAndValidateConfigFiles];
const configInstanceValidators: (() => Promise<boolean>)[] = [validateAndReplaceRefs, validateConfigValues];

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

  for (const configFile of configFiles) {
    await validateConfigFile(configFile, handleError);
  }
}

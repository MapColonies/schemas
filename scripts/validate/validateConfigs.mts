import { promises as fsPromise } from 'node:fs';
import * as path from 'path/posix';
import { AsyncLocalStorage } from 'node:async_hooks';
import { ValidationError, betterAjvErrors } from '@apideck/better-ajv-errors';
import * as configsSchema from '../schemas/configs.schema.json' assert { type: 'json' };
import AjvModule from 'ajv';
import { handleError } from './errors.mjs';

const fileContext = new AsyncLocalStorage<{
  configFilePath: string;
  schemaPath: string;
  schemaVersion: number;
  schema?: any;
  configs?: configInstance[];
}>();

const configContext = new AsyncLocalStorage<{ configName: string; configValue: any }>();

type configInstance = {
  name: string;
  value: any;
};

const configsFileValidator = new AjvModule.default({
  allErrors: true,
}).compile(configsSchema);

async function loadAndValidateConfigFiles(): Promise<boolean> {
  const context = fileContext.getStore();
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
      return false;
    }

    context.configs = parsedContent as configInstance[];

    return true;
  } catch (error) {
    if (error instanceof Error) {
      return false;
    }
    throw error;
  }
}

async function validateSchemaExists(): Promise<boolean> {
  // console.log(file, folder);
  return true;
}

export type ConfigFile = {
  directory: string;
  fileName: string;
};

const configFileValidators: (() => Promise<boolean>)[] = [validateSchemaExists, loadAndValidateConfigFiles];
const configInstanceValidators: (() => Promise<boolean>)[] = [];

export async function validateConfigs(configFiles: ConfigFile[]): Promise<void> {
  for (const configFile of configFiles) {
    // check that there is a schema for the config file (by file name)
    // check that the config file is valid against the configs schema
    // check that name is unique across all config files
    // check that all refs are valid
    // check that the resolved config is valid against the matching schema

    // loadAndParseConfigs;
    const fileNameParts = configFile.fileName.split('.');
    const schemaPath = path.join(configFile.directory, `${fileNameParts[0]}.schema.json`);
    const configFilePath = path.join(configFile.directory, configFile.fileName);
    await fileContext.run({ schemaPath, schemaVersion: parseInt(fileNameParts[0]), configFilePath }, async () => {
      for (const validator of configFileValidators) {
        if (!(await validator())) {
          console.log('error');
          return;
        }
      }
    });
  }
}

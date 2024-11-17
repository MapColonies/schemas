import { promises as fsPromise } from 'node:fs';
import { AsyncLocalStorage } from 'node:async_hooks';
import { ValidationError, betterAjvErrors } from '@apideck/better-ajv-errors';
import * as configsSchema from '../schemas/configs.schema.json' assert { type: 'json' };
import AjvModule from 'ajv';
import { handleError } from './errors.mjs';

type configInstance = {
  name: string;
  value: any;
};

const configsFileValidator = new AjvModule.default({
  allErrors: true,
}).compile(configsSchema);

async function loadAndParseConfigs(file: string): Promise<[false] | [true, configInstance[]]> {
  try {
    const fileContent = await fsPromise.readFile(file, 'utf-8');
    const parsedContent = JSON.parse(fileContent);
    const res = configsFileValidator(JSON.parse(fileContent));
    if (!res) {
      const betterError = betterAjvErrors({
        data: parsedContent,
        errors: configsFileValidator.errors,
        schema: configsSchema,
      });
      handleError(`Error validating configs file: ${betterError.map((err) => err.message).join(', ')}`);
      return [false];
    }

    return [true, parsedContent as configInstance[]];
  } catch (error) {
    if (error instanceof Error) {
      handleError(`Error reading file: ${error.message}`);
      return [false];
    }
    throw error;
  }
}

async function validateSchemaExists(file: string, folder: string): Promise<boolean> {
  console.log(file, folder);
  return false;
}

export type ConfigFile = {
  directory: string;
  fileName: string;
};

export async function validateConfigs(configFiles: ConfigFile[]): Promise<void> {
  for (const configFile of configFiles) {
    // check that there is a schema for the config file (by file name)
    await validateSchemaExists(configFile.fileName, configFile.directory);
    // check that the config file is valid against the configs schema
    // check that name is unique across all config files
    // check that all refs are valid
    // check that the resolved config is valid against the matching schema

    loadAndParseConfigs;
  }
}

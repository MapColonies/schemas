import * as core from '@actions/core';
import path from 'node:path';


export interface FileError {
  file: string | undefined;
  directory: string | undefined;
  error: string;
}

export async function presult<T>(
  promise: Promise<T>
): Promise<[Error, undefined] | [undefined, Awaited<T>]> {
  try {
    const result = await promise;
    return [undefined, result];
  } catch (error) {
    if (error instanceof Error) {
      return [error, undefined];
    }
    throw error;
  }
}

export function result<T extends (...args: any) => any>(
  func: T,
  ...args: Parameters<T>
): [Error, undefined] | [undefined, ReturnType<T>] {
  try {
    const result = func(args);
    return [undefined, result];
  } catch (error) {
    if (error instanceof Error) {
      return [error, undefined];
    }
    throw error;
  }
}

export function setErrorsOnAction(errors: FileError[]) {
  for (const error of errors) {
    core.error(error.error, {
      file:
        error.file && error.directory
          ? path.resolve(error.directory, error.file)
          : undefined,
    });
  }
}

export function printErrorsToConsole(errors: FileError[]) {
  console.error('Errors found in the following files:');
  for (const error of errors) {
    console.error('error:', error.error, ' | file:', error.file, '| directory:', error.directory);
  }
}
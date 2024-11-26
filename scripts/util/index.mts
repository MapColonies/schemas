import * as fsPromise from 'node:fs/promises';
import * as fs from 'node:fs';
import posixPath from 'node:path';

/**
 * Wraps a promise and returns a tuple with either an error or the resolved value.
 * @param promise The promise to wrap.
 * @returns A promise that resolves to a tuple containing either an error or the resolved value.
 */
export async function presult<T>(promise: Promise<T>): Promise<[Error, undefined] | [undefined, Awaited<T>]> {
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

/**
 * Executes a function and returns the result or an error.
 * @param func - The function to execute.
 * @param args - The arguments to pass to the function.
 * @returns An array containing either an error and undefined, or undefined and the result of the function.
 */
export function result<T extends (...args: any) => any>(func: T, ...args: Parameters<T>): [Error, undefined] | [undefined, ReturnType<T>] {
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

/**
 * Generates a tree of files in a directory asynchronously.
 * @param directory The directory to generate the files tree from.
 * @returns An async generator that yields fs.Dirent objects representing files in the directory tree.
 */
export async function* filesTreeGenerator(directory: string): AsyncGenerator<fs.Dirent> {
  const directories = [directory];
  while (directories.length > 0) {
    const currentDirectory = directories.pop() as string;
    const files = await fsPromise.readdir(currentDirectory, { withFileTypes: true });

    for (const file of files) {
      const fullPath = posixPath.join(currentDirectory, file.name);

      if (file.isDirectory()) {
        directories.push(posixPath.join(fullPath));
        continue;
      }

      if (!file.isFile()) {
        throw new Error(`Unexpected file type: ${fullPath}`);
      }

      yield file;
    }
  }
}

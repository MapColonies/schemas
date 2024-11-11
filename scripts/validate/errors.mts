import { AsyncLocalStorage } from 'node:async_hooks';
import { ErrorHandler } from '../util/errorHandling.mjs';

export const fileLocationLocalStorage = new AsyncLocalStorage<{
  directory: string;
  file: string;
}>();

export const errorHandler = new ErrorHandler();

// function to add all errors to the errors array with location context
export function handleError(msg: string, id?: string): void {
  const fileContext = fileLocationLocalStorage.getStore();

  let directory = fileContext?.directory;
  let file = fileContext?.file;

  if (id) {
    const lastSlashIndex = id.lastIndexOf('/');
    directory = path.join('schemas', id.substring(0, lastSlashIndex));

    const fileNameStart = id.substring(lastSlashIndex + 1);
    if (fs.existsSync(path.join(directory, `${fileNameStart}.schema.json`))) {
      file = `${fileNameStart}.schema.json`;
      // } else if (fs.existsSync(path.join(directory, `${fileNameStart}.schema.mts`))) {
      //   file = `${fileNameStart}.schema.mts`;
    } else {
      throw new Error(`Could not find the file ${fileNameStart} referenced in the error`);
    }
  }

  errorHandler.addError({
    file: file ?? undefined,
    directory: directory ?? undefined,
    error: msg,
  });
}

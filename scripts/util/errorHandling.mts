import * as core from '@actions/core';

/**
 * Represents an error related to a file.
 */
export interface FileError {
  /**
   * The file associated with the error.
   */
  file: string | undefined;

  /**
   * The directory associated with the error.
   */
  directory: string | undefined;

  /**
   * The error message.
   */
  error: string;
}

/**
 * Represents an error handler that collects and manages file errors.
 */
export class ErrorHandler {
  private errors: FileError[] = [];

  /**
   * Adds an error to the error handler.
   * @param error The error to be added.
   */
  public addError(...error: FileError[]): void {
    this.errors.push(...error);
  }

  /**
   * Returns an array of all the errors in the error handler.
   * @returns An array of FileError objects.
   */
  public getErrors(): FileError[] {
    return this.errors;
  }

  /**
   * Outputs the errors to the appropriate destination.
   * If running in a GitHub Actions environment, sets the errors as action outputs.
   * Otherwise, prints the errors to the console.
   */
  public outputErrors(): void {
    if (process.env.GITHUB_ACTIONS) {
      this.setErrorsOnAction();
    }
    this.printErrorsToConsole();
  }

  private setErrorsOnAction() {
    for (const error of this.errors) {
      core.error(error.error, {
        file: error.file && error.directory ? path.resolve(error.directory, error.file) : undefined,
      });
    }
  }

  private printErrorsToConsole() {
    console.error('Errors found in the following files:');
    for (const error of this.errors) {
      console.error('error:', error.error, ' | file:', error.file, '| directory:', error.directory);
    }
  }
}

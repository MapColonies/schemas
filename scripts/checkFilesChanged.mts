import 'zx/globals';
import { ErrorHandler } from './util/errorHandling.mjs';

const latestTag = await $`git --no-pager describe --tags $(git rev-list --tags --max-count=1)`;

const latestTagCommitSha = await $`git --no-pager rev-list -n 1 ${latestTag.stdout.trim()}`;
const diff = await $`git --no-pager diff --name-status ${latestTagCommitSha.stdout.trim()} HEAD schemas`;

const gitDiffRegex = /^(?<action>M|D)\s+(?<file>schemas\/.+\.schema\.(?:json|ts))/;

const addedAndModifiedFiles = diff.stdout
  .split('\n')
  .filter((line) => gitDiffRegex.test(line))
  .map((line) => line.split('\t'));

if (addedAndModifiedFiles.length === 0) {
  console.log('No schema files have been added or modified since the latest release.');
  process.exit(0);
}
const errorHandler = new ErrorHandler();
errorHandler.addError(
  ...addedAndModifiedFiles.map(([action, file]) => ({
    file,
    error: `Schema files should not be ${action === 'D' ? 'deleted' : 'modified'} outside of a release.`,
    directory: 'schemas',
  }))
);

console.error('Found schema files that have been added or modified outside of a release:');
errorHandler.outputErrors();
process.exit(1);

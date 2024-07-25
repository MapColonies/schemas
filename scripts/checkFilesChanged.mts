import 'zx/globals';
import { ErrorHandler } from './util/errorHandling.mjs';
import jsonpatch from 'fast-json-patch';

const latestTag = await $`git --no-pager describe --tags $(git rev-list --tags --max-count=1)`;

const latestTagCommitSha = await $`git --no-pager rev-list -n 1 ${latestTag.stdout.trim()}`;
const diff = await $`git --no-pager diff --name-status ${latestTagCommitSha.stdout.trim()} HEAD schemas`;

const gitDiffRegex = /^(?<action>M|D)\s+(?<file>schemas\/.+\.schema\.(?:json|ts))/;

const deletedAndModifiedFiles = diff.stdout
  .split('\n')
  .filter((line) => gitDiffRegex.test(line))
  .map((line) => line.split('\t'));

const badFiles: string[][] = [];

for (const [action, file] of deletedAndModifiedFiles) {
  if (action === 'D') {
    badFiles.push([action, file]);
    continue;
  }
  const lastCorrectFileState = JSON.parse((await $`git show ${latestTagCommitSha.stdout.trim()}:${file}`).stdout);
  const currentFileState = JSON.parse((await $`cat ${file}`).stdout);
  const patch = jsonpatch.compare(lastCorrectFileState, currentFileState);

  for (const operation of patch) {
    const isOperationAllowed = /\/((title|description|example|\$comment|examples)$|examples\/.+)/.test(operation.path);
    if (!isOperationAllowed) {
      badFiles.push([action, file]);
      break;
    }
  }
}

if (badFiles.length === 0) {
  console.log('No schema files have been deleted or modified since the latest release.');
  process.exit(0);
}

const errorHandler = new ErrorHandler();
errorHandler.addError(
  ...badFiles.map(([action, file]) => ({
    file,
    error: `Schema files should not be ${action === 'D' ? 'deleted' : 'modified'} outside of a release.`,
    directory: 'schemas',
  }))
);

console.error('Found schema files that have been deleted or modified outside of a release:');
errorHandler.outputErrors();
process.exit(1);

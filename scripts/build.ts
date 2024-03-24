import path, { join } from 'node:path';
import fs from 'node:fs';
import fsPromise from 'node:fs/promises';
import 'zx/globals';

// list directory contents
const buildDir = 'build';

const directories = ['schemas'];
const filesToDelete = [];

if (fs.existsSync(buildDir)) {
  await fsPromise.rm(buildDir, { recursive: true });
}

for (const directory of directories) {
  const files = await fsPromise.readdir(directory, { withFileTypes: true });

  const filesToImportToIndex = [];

  for (const file of files) {
    const fullPath = path.join(directory, file.name);

    if (file.isDirectory()) {
      directories.push(path.join(fullPath));
      continue;
    }

    if (!file.isFile()) {
      throw new Error(`Unexpected file type: ${fullPath}`);
    }

    let content: string;
    let fileDestPath: string;
    const ext = path.extname(file.name);
    switch (ext) {
      case '.ts':
        content = JSON.stringify((await import(path.join('..', fullPath))).default);
        break;
      case '.json':
        content = await fsPromise.readFile(fullPath, 'utf-8');
        break;
      default:
        continue;
    }

    fileDestPath = path.join(buildDir, directory, path.basename(file.name, ext));

    await fsPromise.mkdir(path.dirname(fileDestPath), { recursive: true });

    await fsPromise.writeFile(`${fileDestPath}.json`, content, {
      encoding: 'utf-8',
    });

    await fsPromise.writeFile(`${fileDestPath}.ts`, `export default ${content.trimEnd()} as const;\n`, { encoding: 'utf-8' });
    filesToDelete.push(`${fileDestPath}.ts`);
    
    const fileVersion = file.name.split('.')[0];
    filesToImportToIndex.push(
      `export { default as ${directory.split(path.sep).at(-1)}_${fileVersion} } from './${fileVersion}.schema.js'`
    );
  }

  if (filesToImportToIndex.length > 0) {
    const indexFilePath = path.join(buildDir, directory, 'index.ts');
    await fsPromise.writeFile(indexFilePath, filesToImportToIndex.join('\n'), { encoding: 'utf-8' });
    filesToDelete.push(indexFilePath);
  }
}

await $`tsc -p tsconfig.build.json`;
// await Promise.all(filesToDelete.map((file) => fsPromise.rm(file)));

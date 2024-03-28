import path from 'node:path';
import fs from 'node:fs';
import fsPromise from 'node:fs/promises';
import camelCase from 'camelcase';
import { $RefParser } from '@apidevtools/json-schema-ref-parser';
import 'zx/globals';

// list directory contents
const buildDir = 'build';

const directories = ['schemas'];
const filesToDelete = [];
const filesToImportToIndex = [];

if (fs.existsSync(buildDir)) {
  await fsPromise.rm(buildDir, { recursive: true });
}

await fsPromise.mkdir(path.join(buildDir, 'schemas'), { recursive: true });

const symbolFilePath = path.join(buildDir,'schemas', 'symbol.ts');

await fsPromise.writeFile(symbolFilePath, 'export const typeSymbol: unique symbol = Symbol.for("typeSymbol");', {
  encoding: 'utf-8',
});

async function* filesTreeGenerator(directory: string): AsyncGenerator<fs.Dirent> {
  const directories = [directory];
  while (directories.length > 0) {
    const currentDirectory = directories.pop() as string;
    const files = await fsPromise.readdir(currentDirectory, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(currentDirectory, file.name);

      if (file.isDirectory()) {
        directories.push(path.join(fullPath));
        continue;
      }

      if (!file.isFile()) {
        throw new Error(`Unexpected file type: ${fullPath}`);
      }

      yield file;
    }
  }
}


for (const directory of directories) {
  const files = await fsPromise.readdir(directory, { withFileTypes: true });


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

    const relativePath = path.relative(path.join(buildDir, directory), path.join(buildDir,'schemas'));

    await fsPromise.writeFile(
      `${fileDestPath}.ts`,
      `import { FromSchema } from 'json-schema-to-ts';
import { typeSymbol } from '${path.join(relativePath, 'symbol.js')}';
export default { 
  [typeSymbol]: '' as unknown as schemaType,
${content.trimEnd().substring(1)} as const;\n`,
      { encoding: 'utf-8' }
    );
    filesToDelete.push(`${fileDestPath}.ts`);
    
    const fileVersion = file.name.split('.')[0];
    
    const schemaName = camelCase(directory.substring(7).replaceAll(path.sep, '_') + '_' + fileVersion)
    filesToImportToIndex.push(`export { default as ${schemaName}, schemaType as ${schemaName}Type } from './${directory.substring(7)}/${fileVersion}.schema.js'`);
  }

  // if (filesToImportToIndex.length > 0) {
  //   const indexFilePath = path.join(buildDir, directory, 'index.ts');
  //   await fsPromise.writeFile(indexFilePath, filesToImportToIndex.join('\n'), { encoding: 'utf-8' });
  //   filesToDelete.push(indexFilePath);
  // }
}


const parser = new $RefParser();
for await (const file of filesTreeGenerator('schemas')) {
  const fileDestPath = path.join(buildDir, file.path, path.basename(file.name, path.extname(file.name)));

  const schema = await parser.dereference(`${fileDestPath}.json`, {
    dereference: {
      circular: false,
    },
    resolve: {
      mapcolonies: {
        canRead: /^https:\/\/mapcolonies.com\/.*/,
        order: 1,
        read: async (file: { url: string; hash: string; extension: string }) => {
          const subPath = file.url.split('https://mapcolonies.com/')[1];

          return fsPromise.readFile(path.join('schemas', subPath + '.schema.json'), { encoding: 'utf-8' });
        },
      },
    },
  });


  await fsPromise.appendFile(`${fileDestPath}.ts`, '\nconst schema = ' + JSON.stringify(schema) + 'as const;\n', { encoding: 'utf-8' });
  await fsPromise.appendFile(
    `${fileDestPath}.ts`,
    'export type schemaType = FromSchema<typeof schema, {parseIfThenElseKeywords: true, parseNotKeyword: true}>;',
    {
      encoding: 'utf-8',
    }
  );
}

const indexFilePath = path.join(buildDir,'schemas', 'index.ts');
await fsPromise.writeFile(indexFilePath, filesToImportToIndex.join('\n') + '\n', { encoding: 'utf-8' });
filesToDelete.push(indexFilePath);

await $`tsc -p tsconfig.build.json`;
// await Promise.all(filesToDelete.map((file) => fsPromise.rm(file)));

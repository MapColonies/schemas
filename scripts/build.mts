import path from 'node:path';
import fs from 'node:fs';
import fsPromise from 'node:fs/promises';
import camelCase from 'camelcase';
import { $RefParser } from '@apidevtools/json-schema-ref-parser';
import 'zx/globals';
import { filesTreeGenerator } from './util/index.mjs';

const buildDir = 'build';
const schemasFolder = 'schemas';

const filesToDelete = [];
const filesToImportToIndex: string[] = ["export type { typeSymbol } from './symbol'"];

// create the root build directory
if (fs.existsSync(buildDir)) {
  await fsPromise.rm(buildDir, { recursive: true });
}
await fsPromise.mkdir(path.join(buildDir, schemasFolder), { recursive: true });

// create symbol file for type import
const symbolFilePath = path.join(buildDir, schemasFolder, 'symbol.ts');
await fsPromise.writeFile(symbolFilePath, 'export const typeSymbol: unique symbol = Symbol.for("typeSymbol");', {
  encoding: 'utf-8',
});
filesToDelete.push(symbolFilePath);

// loop over all the files in the schemas directory and create the build files
for await (const file of filesTreeGenerator(schemasFolder)) {
  const directory = file.path;
  const fullPath = path.join(directory, file.name);
  const fileVersion = file.name.split('.')[0];
  const schemaName = camelCase(directory.substring(schemasFolder.length).replaceAll(path.sep, '_') + '_' + fileVersion);

  let content: any;
  let fileDestPath: string;
  const ext = path.extname(file.name);

  if (file.name.endsWith('.schema.json')) {
    content = JSON.parse(await fsPromise.readFile(fullPath, 'utf-8'));
  } else if (file.name.endsWith('.schema.mts')) {
    content = (await import(path.join('..', fullPath))).default;
  } else {
    continue;
  }

  // add the title to the schema if it doesn't exist
  if (!content.title) {
    content.title = schemaName;
  }

  const stringifiedSchema = JSON.stringify(content);

  fileDestPath = path.join(buildDir, directory, path.basename(file.name, ext));

  await fsPromise.mkdir(path.dirname(fileDestPath), { recursive: true });

  // write the json file with the generated schema
  await fsPromise.writeFile(`${fileDestPath}.json`, stringifiedSchema, {
    encoding: 'utf-8',
  });

  const relativePath = path.relative(path.join(buildDir, directory), path.join(buildDir, schemasFolder));

  const typescriptFileName = `${fileDestPath}.ts`;

  // write the ts file with the generated schema
  await fsPromise.writeFile(
    typescriptFileName,
    `import type { FromExtendedSchema } from "json-schema-to-ts";
import { typeSymbol } from '${path.join(relativePath, 'symbol.js')}';
type CustomProps = {"x-env-value": string ;};
const exported = { 
  [typeSymbol]: '' as unknown as intermediateSchemaType,
${stringifiedSchema.trimEnd().substring(1)} as const;\n`,
    { encoding: 'utf-8' }
  );

  filesToDelete.push(typescriptFileName);

  // add the file to the index file at the root of the package
  filesToImportToIndex.push(
    `export { default as ${schemaName}, schemaType as ${schemaName}Type } from './${directory.substring(7)}/${fileVersion}.schema.js'`
  );
}

// go over all the files in the schemas directory and create a dereferenced schema for json-schema-to-ts usage
const parser = new $RefParser();
for await (const file of filesTreeGenerator(schemasFolder)) {
  const fileDestPath = path.join(buildDir, file.path, path.basename(file.name, path.extname(file.name)));

  if (file.name.endsWith('.configs.json')) {
    fs.cpSync(path.join(file.path, file.name), fileDestPath + '.json');
    continue;
  }

  const dereferencedSchema = await parser.dereference(`${fileDestPath}.json`, {
    dereference: {
      circular: false,
    },
    resolve: {
      mapcolonies: {
        canRead: /^https:\/\/mapcolonies.com\/.*/,
        order: 1,
        read: async (file: { url: string; hash: string; extension: string }) => {
          const subPath = file.url.split('https://mapcolonies.com/')[1];

          return fsPromise.readFile(path.join(schemasFolder, subPath + '.schema.json'), { encoding: 'utf-8' });
        },
      },
    },
  });

  const schemaTs = 'const schema = ' + JSON.stringify(dereferencedSchema) + ' as const;';

  const intermediateSchemaType =
    'type intermediateSchemaType = FromExtendedSchema<CustomProps ,typeof schema, {parseIfThenElseKeywords: true, parseNotKeyword: true}>;';

  const schemaType = 'export type schemaType = (typeof exported)[typeof typeSymbol];';

  const exportDefault = 'export default exported;';

  await fsPromise.appendFile(`${fileDestPath}.ts`, [schemaTs, intermediateSchemaType, schemaType, exportDefault].join('\n'));
}

// create the index file at the root of the package with imports to all the schemas
const indexFilePath = path.join(buildDir, schemasFolder, 'index.ts');
await fsPromise.writeFile(indexFilePath, filesToImportToIndex.join('\n') + '\n', { encoding: 'utf-8' });
filesToDelete.push(indexFilePath);

// compile the typescript files
try {
  await $`npx tsc -p tsconfig.build.json`;
} catch (error) {
  console.log(error);
}

// delete the ts files
await Promise.all(filesToDelete.map((file) => fsPromise.rm(file)));

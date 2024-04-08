# Schemas
A repo for all configuration schemas and for generating the schema NPM package. Any schema can be created based on need. 

When a new version is released, an NPM package containing all the schemas, and their equivalent typescript definitions is published.

## Directory structure
- All schemas created should be nested under the schemas folder.
- The folder structure indicates the name and location of the schema.
- Each schema file should be named in ascending order (v1, v2, v3, ...).
- Schema references should be relative to the root schemas folder. For example, the reference to the the db schema in common is `https://mapcolonies.com/common/db/v1`.
```
└── schemas/
    ├── common/
    │   └── db/
    │       ├── v1.schema.json
    │       └── v2.schema.ts
    └── raster/
        ├── mapproxy/
        │   ├── v1.schema.json
        │   └── v2.schema.json
        └── pycsw/
            └── v1.schema.ts
```

## Schema versioning
In order to simplify the usage and maintainability of the schemas, each schema is given a version number that is a consecutive positive integer.

Once a new version of the package has been released, schemas should not be edited. Instead a new version of the schema should be created.

## Schema files
- The schema files are a [JSON Schema](https://json-schema.org/) in either JSON or Typescript format.
Example of JSON schema in native json format:
```json
{
  "$id": "https://mapcolonies.com/common/example/v1",
  "description": "Example schema",
  "properties": {
    "name": {
      "type": "string",
    }
  }
}
```
- The JSON Schema version used is [Draft-07](https://json-schema.org/draft-07/json-schema-release-notes).
- Each schema should contain the ID field with the value based on the relative location of the schema in the schemas folder.
- If the schema is in Typescript, it should have a default export that is a valid JSON Schema. For convenience, the package [typebox](https://github.com/sinclairzx81/typebox) is installed to help generating JSON Schemas.

The same example as above, but using typebox:
```typescript
import { Type } from '@sinclair/typebox';

const schema = Type.Object(
  {
    type: Type.String(),
  },
  { $id: 'https://mapcolonies.com/common/example/v1', description: 'Example schema' }
);

export default Type.Strict(schema);
```
- Schemas can be composed from other schemas using the key words [AllOf, OneOf, AnyOf](https://json-schema.org/understanding-json-schema/reference/combining) and using [references](https://json-schema.org/understanding-json-schema/structuring).
Example of schema with internal reference:
```json
{
  "$id": "https://mapcolonies.com/common/example/v1",
  "description": "Example internal reference",
  "properties": {
    "name": {
      "$ref": "#/definitions/name"
    }
  },
  "definitions": {
    "name": {
      "type": "string",
      "x-env-value": "NAME"
    }
  }
}

```
- The Schemas can contain both internal references and references to other schemas in the repository. Circular references are not allowed (schemas referencing themselves).
Example of schema with external reference:
```json
{
  "$id": "https://mapcolonies.com/common/example/v1",
  "description": "Example external reference",
  "properties": {
    "name": {
      "$ref": "https://mapcolonies.com/common/name/v1"
    }
  }
}
```


## Custom schema properties
In order to enable extra abilities and features we have added custom properties that can be added to schemas.

- `x-env-value` - The value from which to pull environment variables to override the config values.
- `x-populate-as-env` - ***experimental*** Whether to place the value into the environment variable defined in `x-env-value`.

```json
{
  "$id": "https://mapcolonies.com/common/example/v1",
  "description": "Example custom properties",
  "properties": {
    "name": {
      "type": "string",
      "x-env-value": "NAME"
    }
  }
}
```

## Validations
The repo contains a validation script to make sure all the schemas are valid.
To run the script write the following command into your terminal: `npm run validate`.

The script contains the following validations:
- Each folder contains either folders or only schema files (schema | markdown).
- The schema files are in the correct format - Typescript or JSON.
- The files in the folders are in ascending order (v1,v2,v3,...).
- Each file contains a valid JSON Schema.
- The ID of each schema is in the correct structure - https://mapcolonies.com/directory/v1.schema.json#subReference
- All the references in the schema are valid and point to other schemas in the repo.
- There are no circular references.

## Release
The releases in this repo are managed by [release-please](https://github.com/googleapis/release-please). Release pull requests are automatically opened and are based on commit messages written using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/). To execute the release you only need to merge the opened pull request.

For more information about release-please check the documentation.

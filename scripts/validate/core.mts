// to be replaced by core package in the future
import type { JSONSchemaType } from 'ajv';
import { default as AjvModule } from 'ajv';
import pointer, { JsonObject } from 'json-pointer';

export type ConfigReference = {
  configName: string;
  version: 1 | 'latest';
};

const configRefSchema: JSONSchemaType<ConfigReference> = {
  required: ['configName', 'version'],
  properties: {
    configName: { type: 'string' },
    version: {
      oneOf: [
        { type: 'number', minimum: 1, maximum: 1 },
        { type: 'string', enum: ['latest'] },
      ],
    },
  },
  type: 'object',
  additionalProperties: false,
};

const ajv = new AjvModule.default({});

function validateRef(ref: unknown): ref is ConfigReference {
  return ajv.validate(configRefSchema, ref);
}

export function listConfigRefs(config: any): ConfigReference[] {
  const refs: ConfigReference[] = [];

  pointer.walk(config, (val, key) => {
    if (key.endsWith('$ref/configName')) {
      const refPointer = key.slice(0, key.lastIndexOf('/'));

      const val = pointer.get(config, refPointer) as unknown;
      if (!validateRef(val)) {
        throw new Error(`The reference is not valid: ${JSON.stringify(val)}`);
      }
      refs.push(val);
    }
  });

  return refs;
}

export function replaceRefs(obj: JsonObject, refs: (ConfigReference & { config: any })[]): void {
  // the input is not an object or an array so we don't need to do anything
  if (!Array.isArray(obj) && typeof obj !== 'object') {
    return;
  }

  const paths = new Map<string, ConfigReference>();

  // find all the references in the object
  pointer.walk(obj, (val, key) => {
    if (key.endsWith('$ref/configName')) {
      const refPath = key.slice(0, key.lastIndexOf('/'));
      const ref = pointer.get(obj, refPath) as unknown;
      if (!validateRef(ref)) {
        throw new Error(`The reference in the following path ${refPath} is not valid`);
      }

      paths.set(key.slice(0, key.lastIndexOf('/$ref/configName')), ref);
    }
  });

  for (const [path, ref] of paths) {
    const config = refs.find((r) => r.configName === ref.configName && (ref.version === 'latest' || r.version === ref.version));
    if (!config) {
      throw new Error(`could not find ref in db: ${JSON.stringify(ref)}`);
    }

    // replace the reference in the child object
    replaceRefs(config.config, refs);

    const prevValue = pointer.get(obj, path) as Record<string, unknown>;
    let replacementValue = config.config;

    // if the config is an object we can merge it with the previous value
    if (!Array.isArray(config.config) && typeof config.config === 'object') {
      delete prevValue.$ref;
      replacementValue = { ...prevValue, ...config.config };
    }

    if (path === '') {
      Object.assign(obj, replacementValue);
      return;
    }

    pointer.set(obj, path, replacementValue);
  }
}

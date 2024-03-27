import { Type } from '@sinclair/typebox';

const openapiConfig = Type.Object(
  {
    filePath: Type.String({
      default: './openapi3.yaml',
      description: 'Path to the OpenAPI 3.0 spec file',
    }),
    basePath: Type.String({
      default: '/docs',
      description: 'The base path for the OpenAPI UI and raw OpenAPI spec',
    }),
    rawPath: Type.String({
      default: '/api',
      description: 'The path to the raw OpenAPI spec',
    }),
    uiPath: Type.String({
      default: '/api',
      description: 'The path to the OpenAPI UI',
    }),
  },
  { description: 'OpenAPI configuration', additionalProperties: false}
);

const telemetry = Type.Object(
  {
    logger: Type.Object({
      level: Type.Union(
        [Type.Literal('trace'), Type.Literal('debug'), Type.Literal('info'), Type.Literal('warn'), Type.Literal('error'), Type.Literal('fatal')],
        { default: 'info', description: 'The log level', additionalProperties: false }
      ),
      prettyPrint: Type.Boolean({
        default: false,
        description: 'Whether to pretty print logs',
      }),
    }, { description: 'Logger configuration', additionalProperties: false }),
  },
  { description: 'Telemetry configuration', additionalProperties: false }
);

const server = Type.Object(
  {
    port: Type.Integer({ minimum: 1, maximum: 65535, default: 8080, description: 'The port the server will listen on' }),
    request: Type.Object({
      payload: Type.Object({
        limit: Type.String({ default: '1mb', description: 'The maximum payload size of an incoming request' }),
      }, {additionalProperties: false}),
    }, {additionalProperties: false}),
  },
  { description: 'Server configuration', additionalProperties: false }
);

export default Type.Strict(
  Type.Object(
    {
      openapiConfig,
      telemetry,
      server,
    },
    {
      $schema: 'http://json-schema.org/draft-07/schema#',
      description: 'Boilerplate basic configuration',
      $id: 'https://mapcolonies.com/common/boilerplate/v2',
      additionalProperties: false,
    }
  )
);

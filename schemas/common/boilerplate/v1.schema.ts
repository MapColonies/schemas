import { Type } from '@sinclair/typebox';

const openapiConfig = Type.Object({
  filePath: Type.String({
    default: './openapi3.yaml',
    description: 'Path to the OpenAPI 3.0 spec file',
  }),
  basePath: Type.String({ default: '/docs' }),
  rawPath: Type.String({ default: '/api' }),
  uiPath: Type.String({ default: '/api' }),
});

const telemetry = Type.Object({
  logger: Type.Object({
    level: Type.Union(
      [Type.Literal('trace'), Type.Literal('debug'), Type.Literal('info'), Type.Literal('warn'), Type.Literal('error'), Type.Literal('fatal')],
      { default: 'info' }
    ),
    prettyPrint: Type.Boolean({ default: false }),
  }),
});

const server = Type.Object({
  port: Type.Integer({ minimum: 1, maximum: 65535, default: 8080 }),
  request: Type.Object({
    payload: Type.Object({
      limit: Type.String({ default: '1mb' }),
    }),
  }),
});

export default Type.Strict(
  Type.Object(
    {
      openapiConfig,
      telemetry,
      server,
    },
    { $schema: 'http://json-schema.org/draft-07/schema#', $id: 'https://mapcolonies.com/common/boilerplate/v1' }
  )
);

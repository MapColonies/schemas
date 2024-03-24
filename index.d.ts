import { SchemaOptionss } from '@sinclair/typebox';

// way to extend the possibilities of the SchemaOptions interface for custom properties

declare module '@sinclair/typebox' {
  export interface SchemaOptions {
    'x-env-value'?: string;
    'x-populate-as-env'?: boolean;
  }
}

import { SchemaOptionss } from '@sinclair/typebox';

// way to extend the possibilities of the SchemaOptions interface for custom properties

declare module '@sinclair/typebox' {
  export interface SchemaOptions {
    'X-ENV-VALUE'?: string;
    'X-POPULATE-AS-ENV'?: boolean;
  }
}

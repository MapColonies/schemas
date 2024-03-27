export const partial = {
  "$id": "https://mapcolonies.com/common/db/full/v1",
  "description": "The full database schema including schema and database name",
  "type": "object",
  "allOf": [
    {
      "$ref": "https://mapcolonies.com/common/db/partial/v1"
    },
    {
      "$ref": "#/definitions/db"
    }
  ],
  "definitions": {
    "db": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "schema": {
          "type": "string",
          "description": "The schema name of the database",
          "default": "public"
        },
        "database": {
          "type": "string",
          "description": "The database name",
          "default": "postgres",
          "maxLength": 63
        }
      }
    }
  }
} as const;

export const full = {
  "$id": "https://mapcolonies.com/common/db/full/v1",
  "description": "The full database schema including schema and database name",
  "type": "object",
  "allOf": [
    {
      "$ref": "https://mapcolonies.com/common/db/partial/v1"
    },
    {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "schema": {
          "type": "string",
          "description": "The schema name of the database",
          "default": "public"
        },
        "database": {
          "type": "string",
          "description": "The database name",
          "default": "postgres",
          "maxLength": 63
        }
      }
    }
  ],
  "definitions": {
    "db": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "schema": {
          "type": "string",
          "description": "The schema name of the database",
          "default": "public"
        },
        "database": {
          "type": "string",
          "description": "The database name",
          "default": "postgres",
          "maxLength": 63
        }
      }
    }
  }
} as const;

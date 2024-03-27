/**
 * database configuration for postgres
 */
export interface HttpsMapcoloniesComCommonDbPartialV1 {
  /**
   * the host of the database
   */
  host?: string;
  /**
   * the port of the database
   */
  port?: number;
  /**
   * the username of the database
   */
  username?: string;
  /**
   * the password of the database
   */
  password?: string;
  /**
   * ssl configuration
   */
  ssl?: {
    /**
     * enable ssl
     */
    enabled?: boolean;
    /**
     * the path to the ca file
     */
    ca?: string;
    /**
     * the path to the cert file
     */
    cert?: string;
    /**
     * the path to the key file
     */
    key?: string;
  };
}

export const symbolAvi: unique symbol = Symbol.for('avi');

export default {
  "$id": "https://mapcolonies.com/common/db/partial/v1",
  "description": "database configuration for postgres",
  "additionalProperties": false,
  "type": "object",
  "properties": {
    "host": {
      "type": "string",
      "description": "the host of the database",
      "default": "localhost"
    },
    "port": {
      "type": "integer",
      "description": "the port of the database",
      "default": 5432
    },
    "username": {
      "type": "string",
      "description": "the username of the database",
      "default": "postgres",
      "maxLength": 63
    },
    "password": {
      "type": "string",
      "description": "the password of the database",
      "default": "postgres"
    },
    "ssl": {
      "type": "object",
      "description": "ssl configuration",
      "additionalProperties": false,
      "properties": {
        "enabled": {
          "type": "boolean",
          "description": "enable ssl",
          "default": false
        },
        "ca": {
          "type": "string",
          "description": "the path to the ca file"
        },
        "cert": {
          "type": "string",
          "description": "the path to the cert file"
        },
        "key": {
          "type": "string",
          "description": "the path to the key file"
        }
      },
      "if": {
        "properties": {
          "enabled": {
            "const": true
          }
        }
      },
      "then": {
        "required": ["ca", "cert", "key"]
      },
      "else": {
        "properties": {
          "enabled": {
            "const": false
          }
        }
      }
    }
  }
} as const;

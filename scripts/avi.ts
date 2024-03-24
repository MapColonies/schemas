import { full_v1 } from '../build/schemas/common/db/full/index.js';
import { partial_v1 } from '../build/schemas/common/db/partial/index.js';

import { boilerplate_v2 } from '../build/schemas/common/boilerplate/index.js';
import { default as xd } from '../build/schemas/common/boilerplate/v2.schema.js';

import type { FromSchema } from 'json-schema-to-ts';

type Avi = FromSchema<typeof partial_v1>;

const a: Avi;


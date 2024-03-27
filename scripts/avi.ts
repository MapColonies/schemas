// import { full_v1 } from '../build/schemas/common/db/full/index.js';
// import { partial_v1 } from '../build/schemas/common/db/partial/index.js';
// import { HttpsMapcoloniesComCommonBoilerplateV2 } from '../build/schemas/common/boilerplate/v2.schema.gen.js'
// import { boilerplate_v2 } from '../build/schemas/common/boilerplate/index.js';
// import { default as xd } from '../build/schemas/common/boilerplate/v2.schema.js';

import { FromSchema } from 'json-schema-to-ts';

// type Avi = FromSchema<typeof partial_v1>;

import { JSONSchema } from 'json-schema-to-typescript'
import { default as avi, symbolAvi } from './v1.schema.js'
import {full, partial} from './v2.schema.js'

// const aaa = avi[symbolAvi];


// type a = FromSchema<typeof avi, { parseIfThenElseKeywords: true }>;

// const avia:a
// const ssl = avia.ssl;
// if (ssl?.enabled === true) {
//   ssl.
// }

type c = FromSchema<typeof full, {references: [typeof partial]}>;


// function xd <T extends JSONSchema & {['hitler']: unknown}>(xd: T): T['hitler'] {
//     // const aaa = xd[symbolAvi];
//     // return avi;
//   return xd['hitler'];
// }

// function xd2 <T extends JSONSchema & {[symbolAvi]: unknown}>(xd: T): T[typeof symbolAvi] {
//   // const aaa = xd[symbolAvi];
//   // return avi;
// return xd['aaaaaa'];
// }

// const a = xd2(avi);

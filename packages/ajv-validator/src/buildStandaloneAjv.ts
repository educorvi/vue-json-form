import uiSchema from '@educorvi/vue-json-form-schemas/dist/ui.schema.json';
import draft2019MetaSchema from '@educorvi/vue-json-form-schemas/dist/json-2019.schema.json';

import { default as Ajv } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone';
import * as fs from 'node:fs';

const ajv = new Ajv({
    allowUnionTypes: true,
    schemas: { uiSchema, draft2019MetaSchema },
    code: { source: true, esm: false, optimize: true },
});
addFormats(ajv, ['json-pointer', 'date-time']);

let moduleCode = standaloneCode(ajv, {
    UiSchema: 'https://educorvi.github.io/vue-json-form/schemas/ui.schema.json',
    JsonSchema: 'https://json-schema.org/draft/2019-09/schema#',
});

fs.mkdirSync('./src/generated', { recursive: true });
fs.writeFileSync('./src/generated/validatorCode.cjs', moduleCode);

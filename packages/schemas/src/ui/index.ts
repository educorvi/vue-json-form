import buttonSchema from './button.schema.json';
import buttongroupSchema from './buttongroup.schema.json';
import controlSchema from './control.schema.json';
import dividerSchema from './divider.schema.json';
import htmlSchema from './html.schema.json';
import layoutSchema from './layout.schema.json';
import showOnSchema from './show_on.schema.json';
import uiSchema from './ui.schema.json';
import variantsSchema from './variants.schema.json';
import wizard from './wizard.schema.json';
import RefParser from '@apidevtools/json-schema-ref-parser';

export const allSchemas = [
    buttonSchema,
    buttongroupSchema,
    controlSchema,
    dividerSchema,
    htmlSchema,
    layoutSchema,
    showOnSchema,
    uiSchema,
    variantsSchema,
    wizard
];

export const allSchemasWithIncludedRita = [
    buttonSchema,
    buttongroupSchema,
    controlSchema,
    dividerSchema,
    htmlSchema,
    layoutSchema,
    RefParser.dereference(showOnSchema),
    uiSchema,
    variantsSchema,
    wizard
];

#!/usr/bin/env node
const RefParser = require('@apidevtools/json-schema-ref-parser');
const fs = require('fs');

process.chdir('src/schemas/ui');

RefParser.bundle('ui.schema.json').then((schema) => {
    fs.writeFileSync('../../../dist/ui.schema.json', JSON.stringify(schema, null, 2));
});

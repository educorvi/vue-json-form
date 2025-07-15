#!/usr/bin/env node
const RefParser = require('@apidevtools/json-schema-ref-parser');
const fs = require('fs');
const { join } = require('path');

process.chdir(join(__dirname, 'src/ui'));

async function compile() {
    let schema = await RefParser.bundle('ui.schema.json');
    schema = await RefParser.dereference(schema, {
        dereference: {
            circular: 'ignore',
            onDereference: (path, value) => {
                delete value.$id;
            },
        },
    });
    fs.writeFileSync(join(__dirname, 'src/generated/ui-merged.schema.json'), JSON.stringify(schema, null, 2));
}

compile();

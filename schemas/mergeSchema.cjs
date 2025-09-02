#!/usr/bin/env node
const RefParser = require('@apidevtools/json-schema-ref-parser');
const fs = require('fs');
const { join } = require('path');

process.chdir(join(__dirname, 'src/ui'));

/**
 * Delete all $id properties from the schema
 * @param schema
 * @returns {Promise<void>}
 */
async function deleteIds(schema) {
    if(Array.isArray(schema)) {
        schema.forEach(it => deleteIds(it));
    }else if (typeof schema === 'object') {
        if (schema.$id && schema.$id !== 'https://educorvi.github.io/vue-json-form/schemas/ui.schema.json') {
            delete schema.$id;
        }
        Object.values(schema).forEach(value => deleteIds(value));
    }
}

async function merge() {
    let schema = await RefParser.bundle('ui.schema.json');
    schema = await RefParser.dereference(schema, {
        dereference: {
            circular: 'ignore',
            onDereference: (path, value) => {
                if (value.$id) {
                    // For some reason, this does not work
                    delete value.$id;
                }
            },
        },
    });
    await deleteIds(schema);
    fs.writeFileSync(join(__dirname, 'src/generated/ui-merged.schema.json'), JSON.stringify(schema, null, 2));
}

merge();

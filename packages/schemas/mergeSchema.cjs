#!/usr/bin/env node
const RefParser = require('@apidevtools/json-schema-ref-parser');
const fs = require('fs');
const { join } = require('path');
const { mkdirp } = require('mkdirp');

process.chdir(join(__dirname, 'src/ui'));
const nodeModulesResolver = {
    name: 'nodeModulesResolver',
    order: 1,
    canRead: (file) => {
        return file.url?.includes('/node_modules');
    },

    read(file, callback, $refs) {
        const path = file.url.replace(
            /.*\/node_modules/i,
            '../../../../node_modules'
        );
        try {
            console.log('Reading file', file.url, 'from', path);
            const data = fs.readFileSync(path, 'utf8');
            callback(null, data);
        } catch (e) {
            callback(e);
        }
    },
};

async function merge() {
    const resolveOptions = {
        resolve: {
            nodeModules: nodeModulesResolver,
        },
    };
    let schema = await RefParser.bundle('ui.schema.json', resolveOptions);
    await mkdirp(join(__dirname, 'src/generated'));
    fs.writeFileSync(
        join(__dirname, 'src/generated/ui-merged.schema.json'),
        JSON.stringify(schema, null, 2)
    );
}

async function mergeJsonSchema() {
    let schema = await RefParser.bundle(
        'https://json-schema.org/draft/2019-09/schema#'
    );
    schema = await RefParser.dereference(schema);
    fs.writeFileSync(
        join(__dirname, 'src/generated/json-merged.schema.json'),
        JSON.stringify(schema, null, 2)
    );
}

Promise.all([merge(), mergeJsonSchema()]).then(() => process.exit(0));

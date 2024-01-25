const {compileFromFile} = require('json-schema-to-typescript');
const fs = require('fs');

(async () => {
    const ts = await compileFromFile('./src/schemas/json-schema_draft7.json');
    fs.writeFileSync('./src/typings/json-schema.d.ts', ts);

    const ts_ui = await compileFromFile('./src/schemas/ui/ui.schema.json');
    fs.writeFileSync('./src/typings/ui-schema.d.ts', ts_ui);
})();
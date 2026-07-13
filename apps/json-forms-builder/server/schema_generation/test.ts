import { inspect } from "util";
import { ArrayElement, ObjectElement } from "./elements/container";
import { StringElement } from "./elements/string";
import { fromJson, fromJsonSchemaAndUiSchema } from "./reconstruct";
import type { UISchema } from '@educorvi/vue-json-form-schemas';

let array = new ArrayElement("My Array", undefined, "Add Item");
let innerObject = new ObjectElement("My Inner Object");
let stringElement = new StringElement("My String");
innerObject.children = [stringElement];
array.children = [innerObject];

let json = JSON.stringify(array);
console.log("Serialized JSON:", json);

let deserializedArray = fromJson(json);
console.log("Deserialized Object:", inspect(deserializedArray, { depth: null, colors: true }));

let corrupt_json = JSON.parse(JSON.stringify(array));
delete corrupt_json.title;

// try to deserialize the corrupt json
try {
    let deserializedCorruptArray = fromJson(corrupt_json);
    console.log("Deserialized Corrupt Object:", inspect(deserializedCorruptArray, { depth: null, colors: true }));
} catch (error) {
    console.error("Error deserializing corrupt JSON:", error);
}


const uischema: UISchema = {
    version: '2.0',
    layout: {
        type: 'VerticalLayout',
        elements: []
    }
};
let arrayUiSchema = array.toUiSchema("#/properties/myArray");
uischema.layout.elements.push(arrayUiSchema);
console.log("UI Schema:", uischema);


let jsonSchema = array.toJsonSchema();
console.log("JSON Schema:", jsonSchema);

let deserializedSchema = fromJsonSchemaAndUiSchema(jsonSchema, uischema);
console.log("Deserialized Schema:", inspect(deserializedSchema, { depth: null, colors: true }));


// print zod schema of array
//console.log("Zod Schema of Array:", toJSONSchema(ArrayElement.schema));

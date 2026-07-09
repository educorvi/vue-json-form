import { StringElement, NumberElement, ObjectElement, ArrayElement, HTMLElement, fromJson } from "./FormClasses";
import { toJSONSchema } from "zod";
import { inspect } from "util";

let array = new ArrayElement("My Array", undefined, undefined, undefined, undefined, "Add Item");

let innerObject = new ObjectElement("My Inner Object");

let stringElement = new StringElement("My String");

innerObject.children = [stringElement];

array.children = [innerObject];

let json = JSON.stringify(array);
console.log("Serialized JSON:", json);


// copy the json
let corrupt_json = JSON.parse(JSON.stringify(array));
// check if json contains key title no matter the value
delete corrupt_json.children[0].title;

let deserializedArray = fromJson(json);
console.log("Deserialized Object:", inspect(deserializedArray, { depth: null, colors: true }));

// try to deserialize the corrupt json
try {
    let deserializedCorruptArray = fromJson(corrupt_json);
    console.log("Deserialized Corrupt Object:", inspect(deserializedCorruptArray, { depth: null, colors: true }));
} catch (error) {
    console.error("Error deserializing corrupt JSON:", error);
}

let uiSchema = array.toUiSchema("#/properties/myArray");
console.log("UI Schema:", uiSchema);

let jsonSchema = array.toJsonSchema();
console.log("JSON Schema:", jsonSchema);

let deserializedSchema = ArrayElement.fromJsonSchemaAndUiSchema(jsonSchema, uiSchema);
console.log("Deserialized Schema:", inspect(deserializedSchema, { depth: null, colors: true }));


// print zod schema of array
//console.log("Zod Schema of Array:", toJSONSchema(ArrayElement.schema));

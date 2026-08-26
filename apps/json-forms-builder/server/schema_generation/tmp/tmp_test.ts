import { inspect } from "util";
import { ArrayElement, ObjectElement } from "./elements/container";
import { StringElement, StringFormat } from "./elements/string";
import { fromJson, fromJsonSchemaAndUiSchema } from "./reconstruct";
import type { UISchema } from '@educorvi/vue-json-form-schemas';
import { Form } from "./elements/form";
import { NumberElement } from "./elements/number";
import { HTMLElement } from "./elements/html";



let textElement = new StringElement({"id": "myString", "title": "My String", "description": "This is a string element"});
let form = new Form({"title": "My Form", "id": "myForm"});







let array = new ArrayElement("My Array", undefined, true, "Add Item");
let innerObject = new ObjectElement("My Inner Object");
let stringElement = new StringElement("My String", undefined, StringFormat.Email, true);
let numberElement = new NumberElement("My Number", undefined, undefined, true);
let htmlElement = new HTMLElement("My HTML Element");
innerObject.children = [stringElement, numberElement];
array.children = [innerObject, htmlElement];
let form = new Form("My Form");
form.children = [array];

const uiSchema = form.toUiSchema();
const jsonSchema = form.toJsonSchema();
console.log("UI Schema:", inspect(uiSchema, { depth: null, colors: true }));
console.log("JSON Schema:", inspect(jsonSchema, { depth: null, colors: true }));

// let json = JSON.stringify(array);
// console.log("Serialized JSON:", json);

// let deserializedArray = fromJson(json);
// console.log("Deserialized Object:", inspect(deserializedArray, { depth: null, colors: true }));

// let corrupt_json = JSON.parse(JSON.stringify(array));
// delete corrupt_json.title;

// // try to deserialize the corrupt json
// try {
//     let deserializedCorruptArray = fromJson(corrupt_json);
//     console.log("Deserialized Corrupt Object:", inspect(deserializedCorruptArray, { depth: null, colors: true }));
// } catch (error) {
//     console.error("Error deserializing corrupt JSON:", error);
// }


// const uischema: UISchema = {
//     version: '2.0',
//     layout: {
//         type: 'VerticalLayout',
//         elements: []
//     }
// };
// let arrayUiSchema = array.toUiSchema("#/properties/myArray");
// uischema.layout.elements.push(arrayUiSchema);
// console.log("UI Schema:", uischema);


// let jsonSchema = array.toJsonSchema();
// console.log("JSON Schema:", jsonSchema);

// let deserializedSchema = fromJsonSchemaAndUiSchema(jsonSchema, uischema);
// console.log("Deserialized Schema:", inspect(deserializedSchema, { depth: null, colors: true }));


// // print zod schema of array
// //console.log("Zod Schema of Array:", toJSONSchema(ArrayElement.schema));

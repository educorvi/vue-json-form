import { BooleanElement, ButtonGroupElement, ResetButton, SubmitButton, ColorElement, ArrayElement, ObjectElement, DependencyGroup, Dependency, DividerElement, FileuploadElement, Form, FormDefinition, HTMLElement, ModalElement, NumberElement, SchemaGenerator, EnumElement, CheckboxGroupElement, StringElement, TimeElement, Wizard } from './elements/';
import { DependencyRelation, DependencyType } from './elements/utils';
import { Layout } from './elements/utils';


// Form
const form = new Form({"id": "myForm"});
const formDefinition = new FormDefinition(form);

const textElement = new StringElement({"id": "myString", "title": "My String"});
formDefinition.insertElement(textElement, form, 0);

const booleanElement = new BooleanElement({"id": "myBoolean", "title": "Show color", required: true});
formDefinition.insertElement(booleanElement, form, 1);

const colorElement = new NumberElement({"id": "myColor", "title": "My Color", required: true});
formDefinition.insertElement(colorElement, form, 1);  // moves booleanElement up to index 2

// add dependencies to colorElement

const colorDependency0 = new Dependency({id: "myColorDependency0", sourceId: textElement.uid, dependencyType: DependencyType.minLength, value: 5});
const colorDependencyGroup0 = new DependencyGroup({id: "myColorDependencyGroup", relation: DependencyRelation.or});
formDefinition.addDependencyGroup(colorDependencyGroup0, colorElement.uid);
formDefinition.addDependencyToGroup(colorDependency0, colorDependencyGroup0.uid);

const colorDependency1 = new Dependency({id: "myColorDependency1", sourceId: textElement.uid, dependencyType: DependencyType.minLength, value: 3});
const colorDependency2 = new Dependency({id: "myColorDependency2", sourceId: booleanElement.uid, dependencyType: DependencyType.equal, value: true});
const colorDependencyGroup1 = new DependencyGroup({id: "myColorDependencyGroup", relation: DependencyRelation.and});
formDefinition.addDependencyGroup(colorDependencyGroup1, colorDependencyGroup0.uid);
formDefinition.addDependencyToGroup(colorDependency1, colorDependencyGroup1.uid);
formDefinition.addDependencyToGroup(colorDependency2, colorDependencyGroup1.uid);


// Object
const objectElement = new ObjectElement({"id": "myObject", "title": "My Object"});
formDefinition.insertElement(objectElement, form, 3);

const numberElement = new NumberElement({"id": "myNumber", "title": "My Number", required: true});
formDefinition.insertElement(numberElement, objectElement, 0);

const dividerElement = new DividerElement({"id": "myDivider"});
formDefinition.insertElement(dividerElement, objectElement, 1);

const fileUploadElement = new FileuploadElement({"id": "myFileUpload", "title": "My File Upload"});
formDefinition.insertElement(fileUploadElement, objectElement, 2);

// Array
const arrayElement = new ArrayElement({id: "myArray", title: "My Array", layout: Layout.Horizontal});
formDefinition.insertElement(arrayElement, form, 4);

const htmlElement = new HTMLElement({"id": "myHtml", "htmlData": "<p>This is a paragraph.</p>"});
formDefinition.insertElement(htmlElement, arrayElement, 0);

const modalElement = new ModalElement({id: "myModal", title: "My Modal", buttonLabel: "Open Modal", content: "Hier steht Zeug im Modal"});
formDefinition.insertElement(modalElement, arrayElement, 1);

const checkboxGroupElement = new CheckboxGroupElement({id: "myCheckboxGroup", title: "My Checkbox Group", values: ["Option 1", "Option 2", "Option 3"]});
formDefinition.insertElement(checkboxGroupElement, arrayElement, 2);

// Object in Array
const objectInArrayElement = new ObjectElement({"id": "myObjectInArray", "title": "My Object in Array"});
formDefinition.insertElement(objectInArrayElement, arrayElement, 3);

const timeElement = new TimeElement({"id": "myTime", "title": "My Time"});
formDefinition.insertElement(timeElement, objectInArrayElement, 0);

const enumElement = new EnumElement({"id": "myEnum", "title": "My Enum", values: ["Option A", "Option B", "Option C"]});
formDefinition.insertElement(enumElement, objectInArrayElement, 1);

// add dependencies to timeElement
const timeDependencyGroupAnd = new DependencyGroup({id: "myTimeDependencyGroupAnd", relation: DependencyRelation.and});
formDefinition.addDependencyGroup(timeDependencyGroupAnd, timeElement.uid);

const timeDependencyGroupNot = new DependencyGroup({id: "myTimeDependencyGroupNot", relation: DependencyRelation.not});
formDefinition.addDependencyGroup(timeDependencyGroupNot, timeDependencyGroupAnd.uid);
const timeDependency0 = new Dependency({id: "myTimeDependency0", sourceId: enumElement.uid, dependencyType: DependencyType.equal, value: "Option B"});
formDefinition.addDependencyToGroup(timeDependency0, timeDependencyGroupNot.uid);

const timeDependency1 = new Dependency({id: "myTimeDependency1", sourceId: checkboxGroupElement.uid, dependencyType: DependencyType.equal, value: "Option 2"});
formDefinition.addDependencyToGroup(timeDependency1, timeDependencyGroupAnd.uid);

// Buttons
// TODO



// Object Dependency to booleanElement
// const dependencyGroup = new DependencyGroup({"id": "myDependencyGroup", relation: DependencyRelation.AND});
// formDefinition.addDependencyGroup(dependencyGroup, objectElement.uid);
// const dependency = new Dependency({"id": "myDependency", "sourceId": textElement.uid, dependencyType: DependencyType.equalTo, value: "zeige abhängiges Objekt"});
// formDefinition.addDependencyToGroup(dependency, dependencyGroup.uid);

// SchemaGenerator
const schemaGenerator = new SchemaGenerator(formDefinition);
const uiSchema = form.toUiSchema(schemaGenerator);
const jsonSchema = form.toJsonSchema(schemaGenerator);
console.log("UI Schema:", JSON.stringify(uiSchema));
console.log("JSON Schema:", JSON.stringify(jsonSchema));

// Test wrapped schemas
// const booleanSchema = booleanElement.toWrappedJsonSchema(schemaGenerator);
// console.log("Boolean Json Schema:", JSON.stringify(booleanSchema));
// const booleanUiSchema = booleanElement.toWrappedUiSchema(schemaGenerator, ["properties"]);
// console.log("Boolean UI Schema:", JSON.stringify(booleanUiSchema));


// console.log("Serialized FormDefinition:", JSON.stringify(formDefinition, null, 2));




// // create new form
// const form = new Form("My Form", "This is a test form");
// const formDefinition = new FormDefinition(form);

// // mock save to database and reload
// const databaseJsonString = JSON.stringify(formDefinition);
// console.log("Serialized FormDefinition:", databaseJsonString);
// const reloadedFormDefinition = FormDefinition.fromJSON(databaseJsonString);
// console.log("Reloaded FormDefinition:", reloadedFormDefinition, { depth: null, colors: true });

// // create new elements and add them to the form (usually this would be done through a UI and sent to the server which saves and reloads the form definition every time)
// const array = new ArrayElement("My Array", undefined, true, undefined, "Add Item");
// formDefinition.insertElement(array, form, 0);

// const text = new StringElement("My Text", undefined, undefined, true, undefined, undefined, "tooltip");
// formDefinition.insertElement(text, array, 0);

// const object = new ObjectElement("My Object");
// formDefinition.insertElement(object, form, 1);

// const number = new NumberElement("My Number", undefined, undefined, true, undefined, undefined, "tooltip");
// formDefinition.insertElement(number, object, 0);

// const number2 = new NumberElement("My Number 2", undefined, undefined, true, undefined, undefined, "tooltip");
// formDefinition.insertElement(number2, form, 1); // moves object up to index 2

// // mock save to database and reload
// const databaseJsonString2 = JSON.stringify(formDefinition);
// console.log("Serialized FormDefinition after adding elements:", databaseJsonString2);
// const reloadedFormDefinition2 = FormDefinition.fromJSON(databaseJsonString2);
// console.log("Reloaded FormDefinition after adding elements:", reloadedFormDefinition2, { depth: null, colors: true });

// // generate JSON Schema and UI Schema from the form definition
// const generator = new SchemaGenerator(reloadedFormDefinition2);
// const jsonSchema = generator.generateJsonSchema(form.uid);
// const uiSchema = generator.generateUiSchema(form.uid);

// console.log("Generated JSON Schema:", jsonSchema, { depth: null, colors: true });
// console.log("Generated UI Schema:", uiSchema, { depth: null, colors: true });
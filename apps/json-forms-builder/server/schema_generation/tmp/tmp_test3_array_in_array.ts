import { BooleanElement, ButtonGroupElement, ResetButton, SubmitButton, ColorElement, ArrayElement, ObjectElement, DependencyGroup, Dependency, DividerElement, FileuploadElement, Form, FormDefinition, HTMLElement, ModalElement, NumberElement, SchemaGenerator, EnumElement, CheckboxGroupElement, StringElement, TimeElement, Wizard } from './elements/';
import { DependencyRelation, DependencyType } from './elements/utils';
import { Layout } from './elements/utils';



const form = new Form({id: "double-array-form"});
const formDefinition = new FormDefinition(form);

const arrayElement1 = new ArrayElement({id: "myArray1", title: "My Array 1", layout: Layout.Vertical});
formDefinition.insertElement(arrayElement1, form, 0);

const arrayElement2 = new ArrayElement({id: "myArray2", title: "My Array 2", layout: Layout.Vertical});
formDefinition.insertElement(arrayElement2, arrayElement1, 0);

const stringElement = new StringElement({id: "myString", title: "My String"});
formDefinition.insertElement(stringElement, arrayElement2, 0);

const checkboxGroupElement = new CheckboxGroupElement({id: "myCheckboxGroup", title: "My Checkbox Group", values: ["Option 1", "Option 2", "Option 3"]});
formDefinition.insertElement(checkboxGroupElement, arrayElement2, 1);

const objectElement = new ObjectElement({id: "myObject", title: "My Object"});
formDefinition.insertElement(objectElement, arrayElement2, 2);

const numberElement = new NumberElement({id: "myNumber", title: "My Number"});
formDefinition.insertElement(numberElement, objectElement, 0);
// formDefinition.insertElement(numberElement, arrayElement2, 2);

const dependencyGroupOr = new DependencyGroup({id: "myDependencyGroupOr", relation: DependencyRelation.or});
formDefinition.addDependencyGroup(dependencyGroupOr, numberElement.uid);

const dependency1 = new Dependency({id: "myDependency1", sourceId: stringElement.uid, dependencyType: DependencyType.minLength, value: 3});
formDefinition.addDependencyToGroup(dependency1, dependencyGroupOr.uid);

const dependency2 = new Dependency({id: "myDependency2", sourceId: checkboxGroupElement.uid, dependencyType: DependencyType.equal, value: "Option 2"});
formDefinition.addDependencyToGroup(dependency2, dependencyGroupOr.uid);

const schemaGenerator = new SchemaGenerator(formDefinition);
const jsonSchema = form.toJsonSchema(schemaGenerator);
const uiSchema = form.toUiSchema(schemaGenerator);

console.log("UI Schema:", JSON.stringify(uiSchema));
console.log("JSON Schema:", JSON.stringify(jsonSchema));
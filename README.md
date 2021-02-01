# @educorvi/vue-json-form
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/educorvi/vue_json_form)](https://github.com/educorvi/vue_json_form/releases/latest)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form)](https://www.npmjs.com/package/@educorvi/vue-json-form)
[![Build Status](https://jenkins.jp-studios.de/job/vue_json_form/job/master/badge/icon)](https://jenkins.jp-studios.de/blue/organizations/jenkins/vue_json_form/branches/)
[![GitHub issues](https://img.shields.io/github/issues/educorvi/vue_json_form)](https://github.com/educorvi/vue_json_form/issues)

#### Automaticly generates form from json schema and json ui schema.
- [Documentation](https://educorvi.github.io/vue_json_form/)
- [Demo](https://educorvi.github.io/vue_json_form/demo/)
## Usage
Install with `npm install @educorvi/vue-json-form`. This Component needs [Bootstrap-Vue](https://bootstrap-vue.org/) installed to work.

### Use in VueJS-Component  
``` vue
<template>
  <json-form :json="form" :on-submit="mySubmitMethod"/>
</template>

<script>
import jsonForm from "@educorvi/vue-json-form"

export default {
  name: "Form",
  components: {jsonForm},
  data: {
    form: ...
  },
  methods: {
    mySubmitMethod(data){
        doSomethingWith(data);
    }
  }
}
</script>
```

### Props
|Name|Description|Type|Required|Default|
|---|---|---|---|---|
|json|The form's JSON Schema|`Boolean`|`true`|-|
|onSubmit|Method that is called, when the Form is submitted. Passes the formdata as first Argument|`Function`|`true`|-|
|ui|The form's UI-Schema. If not specified, a default UI-Schema will be generated|`Object or Array`|`false`|-
|disableValidation|Disables the validation of json-schema and ui-schema|`Boolean`|`false`|false|

### Other Options
If you want to change the default submit button or add more buttons or other components to the bottom of the form, you can do so by overriding the default button and put your components in the default slot.  
When doing that, it is important, that the button, that is supposed to submit the form, has `type=submit`.  
Example:
``` vue
<template>
  <json-form :json="form">
    <b-button type="submit" variant="primary">Far better submit button</b-button>
    <p>Thank you!</p>
  </json-form>
</template>

<script>
import jsonForm from "@educorvi/vue-json-form"

export default {
  name: "Form",
  components: {jsonForm},
  data: {
    form: ...
  }
}
</script>
```

### About the Schemas
The form fields themselve are defined in the JSON-Schema. In the UI-Schema, the layout of the form is defined. Fields are inserted into the form by creating a `Control` in the UI-Schema and referring to the field in the JSON-Schema with a json pointer.
[Examples](https://github.com/educorvi/vue_json_form/tree/master/src/exampleSchemas)
#### JSON-Schema
The JSON-Schema must be a valid JSON-Schema.
More details on the json-schema can be found [here](https://json-schema.org/).

#### UI-Schema
The UI-schema must conform to [https://educorvi.github.io/vue_json_form/schemas/ui.schema.json](https://educorvi.github.io/vue_json_form/schemas/ui.schema.json).
Your root object must be a [layout](https://educorvi.github.io/vue_json_form/schemaDoc/#/layout) or a [wizard](https://educorvi.github.io/vue_json_form/schemaDoc/#/wizard).
A layout can be of type `VerticalLayout`, `HorizontalLayout` or `Group` and needs to have an array of [elements](https://educorvi.github.io/vue_json_form/schemaDoc/#/layout-properties-elements-layoutelement).

A wizard needs to have a pages property, which is an array. Each arrayitem needs to hav a title and a content array.

The formfields are represented by elements with [Control](https://educorvi.github.io/vue_json_form/schemaDoc/#/control) objects. They must have a `scope` property, which has the form of a json-pointer and points to the element in the json-schema, that you want to display here.
It can be customized with the [options](https://educorvi.github.io/vue_json_form/schemaDoc/#/control-properties-options) property.
If your control object is for a string, you can set the format of the string with the [format](https://educorvi.github.io/vue_json_form/schemaDoc/#/control#format) property.

Other possible elements are a [HTML renderer](https://educorvi.github.io/vue_json_form/schemaDoc/#/html) and a [divider](https://educorvi.github.io/vue_json_form/schemaDoc/#/divider).

For all types (except wizard pages) it is possible, to define conditional rendering with the [showOn](https://educorvi.github.io/vue_json_form/schemaDoc/#/control-properties-showon-property) property.
Use `scope` to specify a json pointer to the field the reference value should be compared against, `referenceValue` to specify the value and `type` to specify, what kind of comparison should be used. Possible are:

| Value                | Explanation |
| :------------------- | ----------- |
| `"EQUALS"`           | If the field value and the referenceValue are equal            |
| `"NOT_EQUALS"`       | If the field value and the referenceValue are not equal            |
| `"GREATER"`          | If the field value is greater then the referenceValue             |
| `"GREATER_OR_EQUAL"` | If the field value is greater or equal then the referenceValue               |
| `"SMALLER_OR_EQUAL"` | If the field value is smaller or equal then the referenceValue            |
| `"SMALLER"`          | If the field value is smaller then the referenceValue            |
| `"LONGER"`           | Used for strings. If the length of the input in the field specified by `scope` is bigger than the value in `referenceValue`, field will be rendered            |

#### Examples 
For examples have a look in [this folder](https://github.com/educorvi/vue_json_form/tree/master/src/exampleSchemas). To see these examples rendered, open the [demo](https://educorvi.github.io/vue_json_form/demo/) and select the example you want to see from the dropdown menu. 


## Development
## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Lints and fixes files
```
npm run lint
```

### Compiles and minifies for production
```
npm run build
```

### Zips the build-folders
```
npm run zip
```

### Generates the documentation
```
npm run doc
```

### Removes all build-folders
```
npm run clean
```

# @educorvi/vue-json-form
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/educorvi/vue_json_form)](https://github.com/educorvi/vue_json_form/releases/latest)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form)](https://www.npmjs.com/package/@educorvi/vue-json-form)
[![End2End Tests](https://github.com/educorvi/vue_json_form/actions/workflows/cypress.yml/badge.svg)](https://github.com/educorvi/vue_json_form/actions/workflows/cypress.yml)
[![Browserstack Tests](https://github.com/educorvi/vue_json_form/actions/workflows/browserstack.yml/badge.svg)](https://github.com/educorvi/vue_json_form/actions/workflows/browserstack.yml)
[![GitHub issues](https://img.shields.io/github/issues/educorvi/vue_json_form)](https://github.com/educorvi/vue_json_form/issues)

#### Automaticly generates form from json schema and json ui schema.
- [Documentation](https://educorvi.github.io/vue_json_form/)
- [Demo](https://educorvi.github.io/vue_json_form/demo/)
## Usage
Install with `npm install @educorvi/vue-json-form`. This Component needs [Bootstrap-Vue](https://bootstrap-vue.org/) installed to work. If you want to use the wizard, you also have to MdStepper and MdButton from [Vue Material](https://vuematerial.io/).  
Your `main.js` file should look something like this:

``` js
import Vue from 'vue'
import App from './App.vue'

import { BootstrapVue, BIcon, BIconX, BIconPlus, BIconGripVertical } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import { MdSteppers, MdButton } from "vue-material/dist/components"
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'

Vue.use(BootstrapVue);
Vue.component("BIcon", BIcon);
Vue.component("BIconX", BIconX);
Vue.component("BIconPlus", BIconPlus);
Vue.component("BIconGripVertical", BIconGripVertical);

Vue.use(MdSteppers);
Vue.use(MdButton);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
```

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
| Name              | Description                                                                              | Type              | Required | Default |
|-------------------|------------------------------------------------------------------------------------------|-------------------|----------|---------|
| json              | The form's JSON Schema                                                                   | `Object`          | `true`   | -       |
| onSubmit          | Method that is called, when the Form is submitted. Passes the formdata as first Argument | `Function`        | `true`   | -       |
| ui                | The form's UI-Schema. If not specified, a default UI-Schema will be generated            | `Object or Array` | `false`  | -       |
| disableValidation | Disables the validation of json-schema and ui-schema                                     | `Boolean`         | `false`  | false   |

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

### Use as a Web Component
Can be used as a webcomponent. The form data will be posted to a given endpoint. Example:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <link rel="stylesheet" href="https://unpkg.com/@educorvi/vue-json-form/dist/webcomponent/dist.css">
</head>
<body>
<!-- use_x_www_form_urlencoded: Send data urlencoded instead of json-->
<!-- post_url: Url to post the data to-->
<!-- json: Your JSON Schema   -->
<!-- ui: Your UI Schema       -->
<vue-json-form
        use_x_www_form_urlencoded="false"
        post_url='https://YourPostURL.com'
        json='{...}'
        ui='{...}'
></vue-json-form>


<script src="https://unpkg.com/@educorvi/vue-json-form/dist/webcomponent/dist.umd.min.js"></script>
</body>
</html>
```
A working example can be found in the file `webcomponent_example.html`.

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

# @educorvi/vue-json-form
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/educorvi/vue_json_form)](https://github.com/educorvi/vue_json_form/releases/latest)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form)](https://www.npmjs.com/package/@educorvi/vue-json-form)
[![Build Status](https://jenkins.jp-studios.de/job/vue_json_form/job/master/badge/icon)](https://jenkins.jp-studios.de/blue/organizations/jenkins/vue_json_form/branches/)
[![GitHub issues](https://img.shields.io/github/issues/educorvi/vue_json_form)](https://github.com/educorvi/vue_json_form/issues)

#### Automaticly generates form from json schema and json ui schema.
## Usage
Install with `npm install @educorvi/vue-json-form`

### Use in VueJS-Component:  
``` vue
<template>
  <json-form :json="form"/>
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

### Props
|Name|Description|Type|Required|Default|
|---|---|---|---|---|
|json|The form's JSON Schema|`Boolean`|`true`|-|
|ui|The form's UI-Schema. If not specified, a default UI-Schema will be generated|`Object or Array`|`false`|-
|disableValidation|Disables the validation of json-schema and ui-schema|`Boolean`|`false`|false|
|onSubmit|Method that is called, when the Form is submitted. Passes the formdata as first Argument|`Function`|`true`|-|

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

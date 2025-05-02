# @educorvi/vue-json-form

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/educorvi/vue_json_form)](https://github.com/educorvi/vue_json_form/releases/latest)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form)](https://www.npmjs.com/package/@educorvi/vue-json-form)
[![Build And Test](https://github.com/educorvi/vue-json-form/actions/workflows/buildAndTest.yaml/badge.svg?branch=master)](https://github.com/educorvi/vue-json-form/actions/workflows/buildAndTest.yaml)
[![GitHub issues](https://img.shields.io/github/issues/educorvi/vue_json_form)](https://github.com/educorvi/vue_json_form/issues)

#### Automatically generates forms from a JSON schema and an optional UI schema.

- [Documentation](https://educorvi.github.io/vue-json-form/)
- [Demo](https://educorvi.github.io/vue-json-form/demo/)

## Usage

Install with `npm install @educorvi/vue-json-form`.
Import the CSS file into your application:

```ts
import '@educorvi/vue-json-form/dist/vue-json-form.css';
```

Also, make sure that bootstrap 5 is set up for your site.

### Use in VueJS-Component

``` vue
<script setup lang="ts">
import { type SubmitOptions, VueJsonForm } from '@educorvi/vue-json-form';

async function submitMethod(data: Record<string, any>, customSubmitOptions: SubmitOptions, evt: SubmitEvent) {
    emit("viewCode", "Form Results", data);
}

</script>

<template>
    <vue-json-form 
        :jsonSchema="json" 
        :uiSchema="ui"
        :onSubmitForm="submitMethod"
    ></vue-json-form>
</template>

<style scoped>

</style>

```

The slot of the vue-json-form component will be rendered inside the form tag at the end.
It can, for example, be used to add buttons if you don't want to add them to the ui-schema.

### Props

| Name               | Description                                                                                                          | Type       | Required | Default |
|--------------------|----------------------------------------------------------------------------------------------------------------------|------------|----------|---------|
| jsonSchema         | The form's JSON Schema                                                                                               | `Object`   | `true`   | -       |
| onSubmitForm       | Method that is called, when the Form is submitted. Passes the formdata as first Argument                             | `Function` | `true`   | -       |
| uiSchema           | The form's UI-Schema. If not specified, a default UI-Schema will be generated                                        | `Object`   | `false`  | -       |
| renderInterface    | Change the forms UI components                                                                                       | `Object`   | `false`  | -       |
| presetData         | Data that should be loaded into the form.                                                                            | `Object`   | `false`  | -       |
| generationOptions  | Options for the generation of the UI-Schema if no UI-Schema is provided                                              | `Object`   | `false`  | -       |
| returnDataAsScopes | Return data as key value pairs with the keys being the scopes as used in the ui schema and the values being the data | `Object`   | `false`  | -       |
| mapperFunctions    | Functions to change JSON- and UI-Schema of fields before rendering                                                   | `Object`   | `false`  | -       |


### Use as a Web Component
Can be used as a webcomponent.
If you set `action === 'request'` and `requestUrl` in the submit options of the button, the webcomponent will post the form data to the given endpoint in the background.
If either option is not set, the data and the submit options will be emitted as an event with the name `submit`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <link rel="stylesheet" href="https://unpkg.com/@educorvi/vue-json-form-webcomponent@^3/dist/style.css">
</head>
<body>
<!-- json: Your JSON Schema   -->
<!-- ui: Your UI Schema       -->
<vue-json-form
    json='{...}'
    ui='{...}'
></vue-json-form>


<script src="https://unpkg.com/@educorvi/vue-json-form-webcomponent/dist/webcomponent@^3/vue-json-form.umd.js"></script>
</body>
</html>
```

A working example can be found in the file `webcomponent/webcomponent_test.html`.

### About the Schemas

The form fields themselves are defined in the JSON-Schema. In the UI-Schema, the layout of the form is defined. Fields
are inserted into the form by creating a `Control` in the UI-Schema and referring to the field in the JSON-Schema with a
json pointer.
[Examples](https://github.com/educorvi/vue-json-form/tree/master/vue-json-form/src/exampleSchemas)

#### JSON-Schema

The JSON-Schema must be a valid JSON-Schema.
More details on the json-schema can be found [here](https://json-schema.org/).

#### UI-Schema

The UI-schema must conform
to [https://educorvi.github.io/vue-json-form/ui-schema-files/ui.schema.json](https://educorvi.github.io/vue_json_form/schemas/ui.schema.json).
Its documentation can be found [here](https://educorvi.github.io/vue-json-form/ui-schema).

## Development

## Project setup

```
yarn install
```

### Compiles and hot-reloads for development
(In the according folder)

```
yarn run dev
```

### Compiles and minifies for production
(In the according folder)

```
yarn run build
```

### Generates the documentation

```
yarn run doc
```

Needs python package `json-schema-for-humans`

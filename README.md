# VueJsonForm

[![Build And Test](https://img.shields.io/github/actions/workflow/status/educorvi/vue-json-form/buildAndTest.yaml?branch=main&style=for-the-badge&label=Build%20And%20Test)](https://github.com/educorvi/vue-json-form/actions/workflows/buildAndTest.yaml)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

Automatically generates forms from a JSON schema and an optional UI schema.

- [Documentation](https://educorvi.github.io/vue-json-form/)
- [Demo](https://educorvi.github.io/vue-json-form/demo/)

## Packages

This monorepo contains several packages that make up VueJsonForm:

### [@educorvi/vue-json-form](./packages/vue-json-form)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form)

The main Vue.js component for rendering JSON Schema-based forms.

**[View Package Documentation →](./packages/vue-json-form/README.md)**

### [@educorvi/vue-json-form-webcomponent](./packages/webcomponent)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-webcomponent?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-webcomponent)

A standalone web component wrapper for VueJsonForm. Use it in any HTML page without Vue.js.

**[View Package Documentation →](./packages/webcomponent/README.md)**

### [@educorvi/vue-json-form-schemas](./packages/schemas)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-schemas?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-schemas)

JSON Schema definitions and TypeScript types for VueJsonForm. Contains the UI schema specification.

**[View Package Documentation →](./packages/schemas/README.md)**

### [@educorvi/vue-json-form-ajv-validator](./packages/ajv-validator)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-ajv-validator?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-ajv-validator)

Ajv-based validator for VueJsonForm that validates the schemas passed as props.

**[View Package Documentation →](./packages/ajv-validator/README.md)**

## Quick Start

Install the main package:

```bash
npm install @educorvi/vue-json-form
```

Basic usage example:

```vue
<script setup lang="ts">
import { VueJsonForm, bootstrapComponents } from '@educorvi/vue-json-form';
import '@educorvi/vue-json-form/dist/vue-json-form.css';

const jsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' }
  },
  required: ['name', 'email']
};

const uiSchema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/name' },
    { type: 'Control', scope: '#/properties/email' }
  ]
};

function handleSubmit(data: Record<string, any>) {
  console.log('Form submitted:', data);
}
</script>

<template>
  <vue-json-form 
    :jsonSchema="jsonSchema" 
    :uiSchema="uiSchema"
    :onSubmitForm="handleSubmit"
    :renderInterface="bootstrapComponents"
  />
</template>
```

**Note:** Bootstrap 5 is required. See the [full documentation](https://educorvi.github.io/vue-json-form/) for detailed setup instructions.

## Development

### Project setup

```bash
yarn install
```

### Type-Check and Build for Production

```bash
yarn run build
```

### Generate Documentation

```bash
yarn run doc
```

Requires Python package `json-schema-for-humans`.

## License

MIT



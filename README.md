# VueJsonForm

[![Build And Test](https://img.shields.io/github/actions/workflow/status/educorvi/vue-json-form/buildAndTest.yaml?branch=master&style=for-the-badge&label=Build%20And%20Test)](https://github.com/educorvi/vue-json-form/actions/workflows/buildAndTest.yaml)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

Automatically generates forms from a JSON schema and an optional UI schema.

- [Documentation](https://educorvi.github.io/vue-json-form/)
- [Demo](https://educorvi.github.io/vue-json-form/demo/)

## Packages

This monorepo contains several packages that work together to provide comprehensive form generation capabilities:

### [@educorvi/vue-json-form](./vue-json-form)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form)

The main Vue.js component for rendering JSON Schema-based forms. Provides a flexible and extensible form generation system with support for custom layouts, validation, and UI components.

**[View Package Documentation →](./vue-json-form/README.md)**

### [@educorvi/vue-json-form-webcomponent](./webcomponent)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-webcomponent?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-webcomponent)

A standalone web component wrapper for VueJsonForm. Use it in any HTML page without a Vue.js build setup, making it perfect for integrating dynamic forms into existing websites.

**[View Package Documentation →](./webcomponent/README.md)**

### [@educorvi/vue-json-form-schemas](./schemas)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-schemas?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-schemas)

JSON Schema definitions and TypeScript types for VueJsonForm. Contains the UI schema specification that defines how forms are laid out and rendered.

**[View Package Documentation →](./schemas/README.md)**

### [@educorvi/vue-json-form-ajv-validator](./ajv-validator)
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-ajv-validator?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-ajv-validator)

Ajv-based validator for VueJsonForm. Provides robust JSON Schema validation using the industry-standard Ajv library, ensuring your form data meets all schema requirements.

**[View Package Documentation →](./ajv-validator/README.md)**

## Quick Start

Install the main package:

```bash
npm install @educorvi/vue-json-form
```

Basic usage example:

```vue
<script setup lang="ts">
import { VueJsonForm } from '@educorvi/vue-json-form';
import '@educorvi/vue-json-form/dist/vue-json-form.css';

const jsonSchema = { /* your JSON schema */ };
const uiSchema = { /* your UI schema */ };

function handleSubmit(data: Record<string, any>) {
  console.log('Form submitted:', data);
}
</script>

<template>
  <vue-json-form 
    :jsonSchema="jsonSchema" 
    :uiSchema="uiSchema"
    :onSubmitForm="handleSubmit"
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


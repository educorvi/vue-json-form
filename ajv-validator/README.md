# @educorvi/vue-json-form-ajv-validator

[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-ajv-validator?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-ajv-validator)

Ajv-based validator for Vue JSON Form. This package provides schema validation using [Ajv](https://ajv.js.org/) for both JSON Schema and UI Schema validation in VueJsonForm.

## Installation

```sh
npm install @educorvi/vue-json-form-ajv-validator
```

## Usage

```vue

<script setup>
    import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
    import { VueJsonForm } from '@educorvi/vue-json-form';
</script>

<template>
    // Use the validator in your form
    <VueJsonForm
        :jsonSchema="jsonSchema"
        :uiSchema="uiSchema"
        :validator="AjvValidator"
        :onSubmitForm="handleSubmit"
    />
</template>
```

## Development

### Project Setup

```sh
yarn install
```

### Type-Check and Build

```sh
turbo run check-types build
```

### Build Only

```sh
yarn run build
```

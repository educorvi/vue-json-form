# @educorvi/vue-json-form-ajv-validator

[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-ajv-validator?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-ajv-validator)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

Ajv-based validator for Vue JSON Form. This package provides schema validation using [Ajv](https://ajv.js.org/) for both JSON Schema and UI Schema validation in VueJsonForm.

## Installation

```sh
npm install @educorvi/vue-json-form-ajv-validator
```

## Usage

```vue

<script setup>
    import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
    import { VueJsonForm, bootstrapComponents } from '@educorvi/vue-json-form';
</script>

<template>
    // Use the validator in your form
    <VueJsonForm
        :jsonSchema="jsonSchema"
        :uiSchema="uiSchema"
        :validator="AjvValidator"
        :onSubmitForm="handleSubmit"
        :renderInterface="bootstrapComponents"
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
yarn run build
```

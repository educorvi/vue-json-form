# @educorvi/vue-json-form-schemas
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-schemas?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-schemas)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

JSON Schema definitions and TypeScript types for VueJsonForm. Contains the UI schema specification that defines how forms are laid out and rendered.

## Installation

```bash
npm install @educorvi/vue-json-form-schemas
```

## About

This package contains the JSON schemas used by VueJsonForm. When running the build script, a merged schema and the schema's TypeScript types are generated. Changes in a major version are backwards compatible. So a parser for a schema of version $z.x$ must be compatible with all versions $z.y$ where $y \leq x$.

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

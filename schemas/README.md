# Schemas for VueJsonForm
[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-schemas?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-schemas)

This directory contains the JSON schemas used by VueJsonForm. When running the build script, a merged schema and the schema's TypeScript types are generated.
Changes in a major version are backwards compatible. So a parser for a schema of version $z.x$ must be compatible with all versions $z.y$ where $y \leq x$.

## Development

### Project Setup

```sh
yarn install
```

### Type-Check and Build

```sh
turbo run check-types build --filter @educorvi/vue-json-form-schemas
```

### Build Only

```sh
yarn run build
```

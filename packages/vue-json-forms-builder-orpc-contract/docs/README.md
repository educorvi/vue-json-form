# API

The api is documented using [OpenAPI](https://swagger.io/specification/) and is located at [api-development.yaml](./api-development.yaml). [Swagger](https://swagger.io/) or [Scalar](https://scalar.com) can be used to visualize the api documentation and interact with it. The backend also serves `_swagger` and `_scalar` endpoints which render the open api spec directly in the browser. The open api spec is also exposed at `_openapi.json`.

## Current Workflow and improvements

Currently the open api file is the source of truth and generates code for orpc using a ORPC Code Generator from [Hey API](). This works ok, but error types for example are missing in the generated code, so we don't have strong typing here / need to manually add these in the [contract-with-errors.ts](../src/contract-with-errors.ts) file (in the shared [`@educorvi/vue-json-forms-builder-orpc-contract`](../README.md) package). This is not ideal and there is a merge request in the repo requesting this feature, maybe it is supported in the future, we do the step manually or fork the repo and contribute a change in the code generator.

The generation of OpenAPI spec file form orpc code only works ok as many features are missing:

- Example values are missing, this could also be part of the Hey API orpc code generator as many zod types are missing examples. They were manually added within [openapi-schema.ts](../../apps/vue-json-forms-builder/server/orpc/openapi-schema.ts) file.
- Common components for types need to be defined manually as otherwise all endpoint heavily duplicate types leading to massive openapi spec files (10.000 lines of `yaml`). When defining components, some get replaced, but common query parameters for example are not supported and are also duplicated heavily. Within the [openapi.spec.ts](../../apps/vue-json-forms-builder/server/orpc/openapi.spec.ts) file, code was added to deduplicate these components further and also define query parameters for reuse, but this code got complex quite fast and is not ideal.
- `Write Only` fields are not supported by zod which leads to duplicated types in the generated open api file
- `oneOf` with discriminator fields which is supported in OpenAPI spec is not supported when spec is generated from `orpc` which leads to longer and not nice to read spec file

## Summary

### ORPC Code to OpenAPI

Code to orpc has many problems and could work with much effort but the resulting open api file will not be ideal.

### OpenAPI to ORPC Code

The generation of code from the OpenAPI file to zod works pretty well, there are a few smaller problems:
- example values are not really part of the generated code, but this is not necessary
- errors are missing which have to be redundantly in the server spec of orpc additional to the open api spec (since the code generator doesn't handle these currently) or if not implemented are not strongly typed.
- Parts of the spec like the server url and keylcoak for ODC are dynamic. We need a custom server plugin which adjust the spec file dynamically in runtime with the correct values, but this should be easy to implement


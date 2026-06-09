# @educorvi/vue-json-form-webcomponent

[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-webcomponent?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-webcomponent)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

A standalone web component wrapper for VueJsonForm. Use it in any HTML page without a Vue.js build setup.

## Installation

```bash
npm install @educorvi/vue-json-form-webcomponent
```

Or use it directly from a CDN. See the example below.

## Variants

All bundles register the same custom element tag: `<vue-json-form>`.

| Variant        | Bundle path                              | Description                                                                                                     |
| -------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `default`      | `dist/default/vue-json-form.umd.js`      | Light DOM web component without built-in schema validation. The surrounding page must provide Bootstrap styles. |
| `ajvValidator` | `dist/ajvValidator/vue-json-form.umd.js` | Light DOM web component with AJV schema validation enabled by default.                                          |
| `shadowDom`    | `dist/shadowDom/vue-json-form.umd.js`    | Shadow DOM web component with bundled Bootstrap and Vue JSON Form styles.                                       |

## Usage

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>Vue JSON Form Web Component</title>
        <link
            rel="stylesheet"
            href="https://unpkg.com/@educorvi/vue-json-form-webcomponent@3/dist/default/vue-json-form.css"
        />
    </head>
    <body>
        <vue-json-form id="form"></vue-json-form>

        <script src="https://unpkg.com/@educorvi/vue-json-form-webcomponent@3/dist/default/vue-json-form.umd.js"></script>
        <script>
            const form = document.querySelector('#form');

            form.setAttribute(
                'json-schema',
                JSON.stringify({
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                    },
                })
            );

            form.setAttribute(
                'ui-schema',
                JSON.stringify({
                    type: 'VerticalLayout',
                    elements: [
                        { type: 'Control', scope: '#/properties/name' },
                        {
                            type: 'Button',
                            buttonType: 'submit',
                            text: 'Submit',
                            submitOptions: { action: 'emit' },
                        },
                    ],
                })
            );

            form.addEventListener('submit', (event) => {
                const [data, options] = event.detail;
                console.log(data, options);
            });
        </script>
    </body>
</html>
```

A working local example is available in `packages/webcomponent/webcomponent_test.html`.

## Attributes

| Attribute               | Type           | Description                                                                                                     |
| ----------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| `json-schema`           | string         | JSON-serialized JSON Schema for the form. Required unless `json-schema-url` is provided.                        |
| `ui-schema`             | string         | JSON-serialized UI Schema that controls layout and options.                                                     |
| `json-schema-url`       | string         | URL that is loaded with `GET` and used as the JSON Schema. Takes precedence over `json-schema`.                 |
| `ui-schema-url`         | string         | URL that is loaded with `GET` and used as the UI Schema. Takes precedence over `ui-schema`.                     |
| `preset-data`           | string         | JSON-serialized object with initial form values.                                                                |
| `return-data-as-scopes` | boolean/string | When set to `true` or `"true"`, submitted data uses UI schema scopes as keys. Otherwise it defaults to `false`. |
| `no-validate`           | boolean        | `ajvValidator` variant only. Disables AJV validation when set.                                                  |

## Submit Actions

Submission behavior is controlled by `submitOptions` on submit buttons in the UI Schema.

### Emit

Any action other than `request` or `summary` emits the form data through the `submit` event.

```json
{
    "type": "Button",
    "buttonType": "submit",
    "text": "Submit",
    "submitOptions": { "action": "emit" }
}
```

### HTTP Request

When `action` is `request`, the component sends the form data with Axios. `request.url` can be a string or an array of strings. The default method is `POST`.

```json
{
    "type": "Button",
    "buttonType": "submit",
    "text": "Save",
    "submitOptions": {
        "action": "request",
        "request": {
            "url": "https://example.com/api/form",
            "method": "POST",
            "headers": { "Content-Type": "application/json" },
            "onSuccessRedirect": "https://example.com/success"
        }
    }
}
```

If `request.url` is missing or an empty array, the component falls back to emitting `submit`. For multiple URLs, requests are sent sequentially and stop after the first failure.

### Summary

When `action` is `summary`, the component reads a document URL from the submitted data, downloads it as a blob, and posts it to the configured SSE summary endpoint as multipart form data.

```json
{
    "type": "Button",
    "buttonType": "submit",
    "text": "Create summary",
    "submitOptions": {
        "action": "summary",
        "summary": {
            "field": "document",
            "documentTypeField": "documentType",
            "apiEndpoint": "https://example.com/ai/summary",
            "saveUrl": "https://example.com/ai/summary/save",
            "feedbackUrl": "https://example.com/feedback",
            "copyToClipboard": true
        }
    }
}
```

The summary request sends `promptType` and `document`. If the `__ac` cookie exists, it is forwarded as the `X-AC-Session-Token` header. SSE events named `progress`, `result`, and `error` are logged and used to update the built-in result modal.

## Events

Vue custom-element events are dispatched as `CustomEvent`s. Vue passes emitted arguments as an array in `event.detail`.

| Event                    | When fired                                                                                                                                                                     | `event.detail`    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| `submit`                 | A non-request action is submitted, or `request` has no usable URL.                                                                                                             | `[data, options]` |
| `submitSucceeded`        | Emit fallback or all configured HTTP requests completed successfully.                                                                                                          | `[data, options]` |
| `submitFailed`           | At least one configured HTTP request failed.                                                                                                                                   | `[data, options]` |
| `afterSubmitted`         | Fired after `submitSucceeded` or `submitFailed` for emit/request flows. Not fired for `summary`, because the summary flow returns after starting the modal-driven SSE request. | `[data, options]` |
| `schemaLoadingSucceeded` | `json-schema-url` or `ui-schema-url` was loaded successfully.                                                                                                                  | `[url]`           |
| `schemaLoadingFailed`    | Loading `json-schema-url` or `ui-schema-url` failed.                                                                                                                           | `[url, error]`    |
| `schemaParsingFailed`    | A loaded or inline JSON/UI schema could not be parsed.                                                                                                                         | `[schema, error]` |

```js
form.addEventListener('submitSucceeded', (event) => {
    const [data, options] = event.detail;
    console.log('submitted', data, options);
});

form.addEventListener('schemaLoadingFailed', (event) => {
    const [url, error] = event.detail;
    console.error('schema load failed', url, error);
});
```

## Development

### Project setup

```bash
yarn install
```

### Compile and hot-reload for development

```bash
yarn run dev
```

### Type-check and build for production

```bash
yarn run build
```

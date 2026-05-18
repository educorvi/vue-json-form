# @educorvi/vue-json-form-webcomponent

[![npm](https://img.shields.io/npm/v/@educorvi/vue-json-form-webcomponent?style=for-the-badge)](https://www.npmjs.com/package/@educorvi/vue-json-form-webcomponent)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

A standalone web component wrapper for VueJsonForm. Use it in any HTML page without a Vue.js build setup.

## Installation

```bash
npm install @educorvi/vue-json-form-webcomponent
```

Or use it directly from a CDN (see usage example below).

## Usage

VJF can be used as a web component.
Bootstrap needs to be set up on the surrounding page.
If you set `action: 'request'` and `request.url` in the submit button options of the UI Schema, the web component will post the form data to the given endpoint in the background and emit `submitSucceeded` or `submitFailed` accordingly.
If `request.url` is not set, the form data is emitted as a `submit` event instead.
See the [Events](#events) section below for the full list of events.

There are three variants of the web component:

- default
- shadowDom (where the webcomponent is inside of a schadow dom)
- ajvValidator (validates the provided schemas)

### Attributes

| Attribute              | Type    | Description                                                                                          |
| ---------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `json-schema`          | string  | **(Required)** JSON-serialized JSON Schema for the form.                                             |
| `ui-schema`            | string  | JSON-serialized UI Schema that controls layout and options.                                          |
| `preset-data`          | string  | JSON-serialized object with initial / pre-filled form values.                                        |
| `return-data-as-scopes`| boolean | When `"true"`, the submitted data object uses UI-Schema scopes as keys instead of JSON Schema paths. |
| `no-validate`          | boolean | *(ajvValidator variant only)* Disables AJV schema validation when set.                               |

The submission of results is controlled via the submit buttons in the UI Schema.

### Events

Web-component events are dispatched as `CustomEvent`s. Access the payload via `event.detail`.

| Event            | When fired                                                                                                      | `event.detail`                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `submit`         | The submit button action is not `request`, **or** `request` is configured but no URL is provided.              | `{ data, options }`                     |
| `submitSucceeded`| All configured HTTP requests completed successfully.                                                            | `{ data, options }`                     |
| `submitFailed`   | At least one of the configured HTTP requests failed.                                                            | `{ data, options }`                     |
| `afterSubmitted` | Always fired after the submit cycle finishes (regardless of success or failure), unless action is `summary`.   | `{ data, options }`                     |

`data` is the collected form data object. `options` is the submit-button options object from the UI Schema.

```js
document.querySelector('vue-json-form').addEventListener('submit', (event) => {
    const { data, options } = event.detail;
    console.log(data);
});
```

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>Title</title>
        <link
            rel="stylesheet"
            href="https://unpkg.com/@educorvi/vue-json-form-webcomponent@3/dist/default/vue-json-form.css"
        />
    </head>
    <body>
        <vue-json-form json-schema="{...}" ui-schema="{...}"></vue-json-form>

        <script src="https://unpkg.com/@educorvi/vue-json-form-webcomponent@3/dist/default/vue-json-form.umd.js"></script>
    </body>
</html>
```

A working example can be found in the file `webcomponent/webcomponent_test.html`.

## Development

### Project setup

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn run dev
```

### Type-Check and Build for Production

```
yarn run build
```

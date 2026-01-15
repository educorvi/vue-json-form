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
VJF can be used as a webcomponent.
Bootstrap needs to be set up on the surrounding page.
If you set `action === 'request'` and `request.url` in the submit options of the button, the webcomponent will post the form data to the given endpoint in the background.
If one of those options is not set, the data and the submit options will be emitted as an event with the name `submit`.

There are three variants of the webcomponent:
- default
- shadowDom (where the webcomponent is inside of a schadow dom)
- ajvValidator (validates the provided schemas)

Supported options are:
- `jsonSchema`
- `uiSchema`
- `presetData`
- `returnDataAsScopes`
- `noValidate` (only for `ajvValidator` variant, disables validation)

The submission of results is controlled via the submit buttons in the UI Schema.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <link rel="stylesheet" href="https://unpkg.com/@educorvi/vue-json-form-webcomponent@3/dist/default/vue-json-form.css">
</head>
<body>
<!-- json: Your JSON Schema   -->
<!-- ui: Your UI Schema       -->
<vue-json-form
    jsonSchema='{...}'
    uiSchema='{...}'
></vue-json-form>


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

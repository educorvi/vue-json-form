# VueJsonForm Webcomponent

![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=flat&logo=vuedotjs&logoColor=%234FC08D)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)


## Usage
VJF can be used as a webcomponent.
Bootstrap needs to be set up on the surrounding page.
If you set `action === 'request'` and `request.url` in the submit options of the button, the webcomponent will post the form data to the given endpoint in the background.
If one of those options is not set, the data and the submit options will be emitted as an event with the name `submit`.

Supported options are:
- `jsonSchema`
- `uiSchema`
- `presetData`
- `returnDataAsScopes`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <link rel="stylesheet" href="https://unpkg.com/@educorvi/vue-json-form-webcomponent@beta/dist/default/vue-json-form.css">
</head>
<body>
<!-- json: Your JSON Schema   -->
<!-- ui: Your UI Schema       -->
<vue-json-form
    jsonSchema='{...}'
    uiSchema='{...}'
></vue-json-form>


<script src="https://unpkg.com/@educorvi/vue-json-form-webcomponent@beta/dist/default/vue-json-form.umd.js"></script>
</body>
</html>
```

A working example can be found in the file `webcomponent/webcomponent_test.html`.

## Development

## Project setup

```
yarn install
```

### Compiles and minifies for production
(In the according folder)

```
turbo build
```

# Control Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/control.schema.json
```

Contains a form element, e. g. a text input

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                   |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :--------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [control.schema.json](../schemas/control.schema.json "open original schema") |

## Control Type

`object` ([Control](control.md))

# Control Properties

| Property            | Type     | Required | Nullable       | Defined by                                                                                                                                 |
| :------------------ | :------- | :------- | :------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| [type](#type)       | `string` | Required | cannot be null | [Control](control-properties-type.md "https://educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/type")              |
| [scope](#scope)     | `string` | Required | cannot be null | [Control](control-properties-scope.md "https://educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/scope")            |
| [format](#format)   | `string` | Optional | cannot be null | [Control](control-properties-format.md "https://educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/format")          |
| [options](#options) | `object` | Optional | cannot be null | [Control](control-properties-options.md "https://educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options")        |
| [showOn](#showon)   | `object` | Optional | cannot be null | [Control](control-properties-showon-property.md "https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/showOn") |

## type



`type`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Control](control-properties-type.md "https://educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/type")

### type Type

`string`

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value       | Explanation |
| :---------- | :---------- |
| `"Control"` |             |

## scope

A json pointer referring to the form element in the forms json schema

`scope`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Control](control-properties-scope.md "https://educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/scope")

### scope Type

`string`

### scope Constraints

**JSON Pointer**: the string must be a JSON Pointer, according to [RFC 6901, section 5](https://tools.ietf.org/html/rfc6901 "check the specification")

## format

Format for string fields

`format`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Control](control-properties-format.md "https://educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/format")

### format Type

`string`

### format Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value         | Explanation |
| :------------ | :---------- |
| `"time"`      |             |
| `"date"`      |             |
| `"date-time"` |             |
| `"email"`     |             |
| `"password"`  |             |
| `"search"`    |             |
| `"url"`       |             |
| `"tel"`       |             |
| `"color"`     |             |

## options

Gives multiple options to configure the element

`options`

*   is optional

*   Type: `object` ([Options](control-properties-options.md))

*   cannot be null

*   defined in: [Control](control-properties-options.md "https://educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options")

### options Type

`object` ([Options](control-properties-options.md))

## showOn

Show field depending on value of other field

`showOn`

*   is optional

*   Type: `object` ([ShowOn property](control-properties-showon-property.md))

*   cannot be null

*   defined in: [Control](control-properties-showon-property.md "https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/showOn")

### showOn Type

`object` ([ShowOn property](control-properties-showon-property.md))

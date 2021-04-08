# Layout Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/layout.schema.json
```

The different Layouts

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                 |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [layout.schema.json](../schemas/layout.schema.json "open original schema") |

## Layout Type

`object` ([Layout](layout.md))

## Layout Examples

```json
{
  "type": "VerticalLayout",
  "elements": []
}
```

```json
{
  "type": "Group",
  "label": "This is a group",
  "elements": []
}
```

# Layout Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                                                |
| :-------------------- | :------- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| [type](#type)         | `string` | Required | cannot be null | [Layout](layout-properties-type.md "https://educorvi.github.io/vue_json_form/schemas/layout.schema.json#/properties/type")                |
| [elements](#elements) | `array`  | Required | cannot be null | [Layout](layout-properties-elements.md "https://educorvi.github.io/vue_json_form/schemas/layout.schema.json#/properties/elements")        |
| [showOn](#showon)     | `object` | Optional | cannot be null | [Layout](control-properties-showon-property.md "https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/showOn") |
| [label](#label)       | `string` | Optional | cannot be null | [Layout](layout-properties-label.md "https://educorvi.github.io/vue_json_form/schemas/layout.schema.json#/properties/label")              |
| [$schema](#schema)    | `string` | Optional | cannot be null | [Layout](layout-properties-schema.md "https://educorvi.github.io/vue_json_form/schemas/layout.schema.json#/properties/$schema")           |
| [options](#options)   | `object` | Optional | cannot be null | [Layout](layout-properties-options.md "https://educorvi.github.io/vue_json_form/schemas/layout.schema.json#/properties/options")          |

## type



`type`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Layout](layout-properties-type.md "https://educorvi.github.io/vue_json_form/schemas/layout.schema.json#/properties/type")

### type Type

`string`

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value                | Explanation |
| :------------------- | :---------- |
| `"VerticalLayout"`   |             |
| `"HorizontalLayout"` |             |
| `"Group"`            |             |

## elements

The elements of the layout

`elements`

*   is required

*   Type: an array of merged types ([Layoutelement](layout-properties-elements-layoutelement.md))

*   cannot be null

*   defined in: [Layout](layout-properties-elements.md "https://educorvi.github.io/vue_json_form/schemas/layout.schema.json#/properties/elements")

### elements Type

an array of merged types ([Layoutelement](layout-properties-elements-layoutelement.md))

### elements Default Value

The default value is:

```json
[]
```

## showOn

Show field depending on value of other field

`showOn`

*   is optional

*   Type: `object` ([ShowOn property](control-properties-showon-property.md))

*   cannot be null

*   defined in: [Layout](control-properties-showon-property.md "https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/showOn")

### showOn Type

`object` ([ShowOn property](control-properties-showon-property.md))

## label



`label`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Layout](layout-properties-label.md "https://educorvi.github.io/vue_json_form/schemas/layout.schema.json#/properties/label")

### label Type

`string`

## $schema

May contain a schema reference to the uischema

`$schema`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Layout](layout-properties-schema.md "https://educorvi.github.io/vue_json_form/schemas/layout.schema.json#/properties/$schema")

### $schema Type

`string`

## options

Additional Options

`options`

*   is optional

*   Type: `object` ([Details](layout-properties-options.md))

*   cannot be null

*   defined in: [Layout](layout-properties-options.md "https://educorvi.github.io/vue_json_form/schemas/layout.schema.json#/properties/options")

### options Type

`object` ([Details](layout-properties-options.md))

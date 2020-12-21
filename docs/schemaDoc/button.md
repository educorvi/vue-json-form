# Button Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/button.schema.json
```

Used to put a button into the form


| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                 |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | -------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [button.schema.json](../schemas/button.schema.json "open original schema") |

## Button Type

`object` ([Button](button.md))

# Button Properties

| Property                  | Type     | Required | Nullable       | Defined by                                                                                                                                                |
| :------------------------ | -------- | -------- | -------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [type](#type)             | `string` | Required | cannot be null | [Button](button-properties-type.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/type")                           |
| [buttonType](#buttontype) | `string` | Required | cannot be null | [Button](button-properties-the-buttons-type.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/buttonType")         |
| [text](#text)             | `string` | Optional | cannot be null | [Button](button-properties-text.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/text")                           |
| [variant](#variant)       | `string` | Optional | cannot be null | [Button](button-properties-bootstrap-button-variants.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/variants.schema.json#/properties/variant") |

## type




`type`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [Button](button-properties-type.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/type")

### type Type

`string`

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value      | Explanation |
| :--------- | ----------- |
| `"Button"` |             |

## buttonType

Currently, only a submit button is supported


`buttonType`

-   is required
-   Type: `string` ([The Buttons Type](button-properties-the-buttons-type.md))
-   cannot be null
-   defined in: [Button](button-properties-the-buttons-type.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/buttonType")

### buttonType Type

`string` ([The Buttons Type](button-properties-the-buttons-type.md))

### buttonType Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value      | Explanation |
| :--------- | ----------- |
| `"submit"` |             |

## text

The buttons text


`text`

-   is optional
-   Type: `string` ([Text](button-properties-text.md))
-   cannot be null
-   defined in: [Button](button-properties-text.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/text")

### text Type

`string` ([Text](button-properties-text.md))

## variant

The Variants, that Bootstrap allows you to have


`variant`

-   is optional
-   Type: `string` ([Bootstrap Button Variants](button-properties-bootstrap-button-variants.md))
-   cannot be null
-   defined in: [Button](button-properties-bootstrap-button-variants.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/variants.schema.json#/properties/variant")

### variant Type

`string` ([Bootstrap Button Variants](button-properties-bootstrap-button-variants.md))

### variant Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value                 | Explanation |
| :-------------------- | ----------- |
| `"primary"`           |             |
| `"secondary"`         |             |
| `"success"`           |             |
| `"warning"`           |             |
| `"danger"`            |             |
| `"info"`              |             |
| `"light"`             |             |
| `"dark"`              |             |
| `"outline-primary"`   |             |
| `"outline-secondary"` |             |
| `"outline-success"`   |             |
| `"outline-warning"`   |             |
| `"outline-danger"`    |             |
| `"outline-info"`      |             |
| `"outline-light"`     |             |
| `"outline-dark"`      |             |

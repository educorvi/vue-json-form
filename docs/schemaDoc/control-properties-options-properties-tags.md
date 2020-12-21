# Untitled object in Control Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/tags
```

Will be rendered as tags-Field


| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                     |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------------------ |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [control.schema.json\*](../schemas/control.schema.json "open original schema") |

## tags Type

`object` ([Details](control-properties-options-properties-tags.md))

# undefined Properties

| Property            | Type      | Required | Nullable       | Defined by                                                                                                                                                                                                     |
| :------------------ | --------- | -------- | -------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [enabled](#enabled) | `boolean` | Optional | cannot be null | [Control](control-properties-options-properties-tags-properties-enabled.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/tags/properties/enabled") |
| [variant](#variant) | `string`  | Optional | cannot be null | [Control](button-properties-bootstrap-button-variants.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/variants.schema.json#/properties/options/properties/tags/properties/variant")                  |
| [pills](#pills)     | `boolean` | Optional | cannot be null | [Control](control-properties-options-properties-tags-properties-pills.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/tags/properties/pills")     |

## enabled




`enabled`

-   is optional
-   Type: `boolean`
-   cannot be null
-   defined in: [Control](control-properties-options-properties-tags-properties-enabled.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/tags/properties/enabled")

### enabled Type

`boolean`

## variant

The Variants, that Bootstrap allows you to have


`variant`

-   is optional
-   Type: `string` ([Bootstrap Button Variants](button-properties-bootstrap-button-variants.md))
-   cannot be null
-   defined in: [Control](button-properties-bootstrap-button-variants.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/variants.schema.json#/properties/options/properties/tags/properties/variant")

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

## pills




`pills`

-   is optional
-   Type: `boolean`
-   cannot be null
-   defined in: [Control](control-properties-options-properties-tags-properties-pills.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/tags/properties/pills")

### pills Type

`boolean`

# Divider Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/divider.schema.json
```

inserts a simple divider


| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                   |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | ---------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [divider.schema.json](../schemas/divider.schema.json "open original schema") |

## Divider Type

`object` ([Divider](divider.md))

# Divider Properties

| Property          | Type     | Required | Nullable       | Defined by                                                                                                                                      |
| :---------------- | -------- | -------- | -------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| [type](#type)     | `string` | Required | cannot be null | [Divider](divider-properties-type.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/divider.schema.json#/properties/type")              |
| [showOn](#showon) | `object` | Optional | cannot be null | [Divider](control-properties-showon-property.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/showOn") |

## type




`type`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [Divider](divider-properties-type.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/divider.schema.json#/properties/type")

### type Type

`string`

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value       | Explanation |
| :---------- | ----------- |
| `"Divider"` |             |

## showOn

Show field depending on value of other field


`showOn`

-   is optional
-   Type: `object` ([ShowOn property](control-properties-showon-property.md))
-   cannot be null
-   defined in: [Divider](control-properties-showon-property.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/showOn")

### showOn Type

`object` ([ShowOn property](control-properties-showon-property.md))

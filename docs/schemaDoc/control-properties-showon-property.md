# ShowOn property Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/showOn
```

Show field depending on value of other field

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                    |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :---------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [control.schema.json*](../schemas/control.schema.json "open original schema") |

## showOn Type

`object` ([ShowOn property](control-properties-showon-property.md))

# showOn Properties

| Property                          | Type     | Required | Nullable       | Defined by                                                                                                                                                |
| :-------------------------------- | :------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [scope](#scope)                   | `string` | Required | cannot be null | [ShowOn property](show_on-properties-scope.md "https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/scope")                   |
| [type](#type)                     | `string` | Required | cannot be null | [ShowOn property](show_on-properties-type.md "https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/type")                     |
| [referenceValue](#referencevalue) | Merged   | Required | cannot be null | [ShowOn property](show_on-properties-referencevalue.md "https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/referenceValue") |

## scope

The field this field depends on

`scope`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [ShowOn property](show_on-properties-scope.md "https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/scope")

### scope Type

`string`

### scope Constraints

**JSON Pointer**: the string must be a JSON Pointer, according to [RFC 6901, section 5](https://tools.ietf.org/html/rfc6901 "check the specification")

## type

Condition to be applied

`type`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [ShowOn property](show_on-properties-type.md "https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/type")

### type Type

`string`

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value                | Explanation |
| :------------------- | :---------- |
| `"EQUALS"`           |             |
| `"NOT_EQUALS"`       |             |
| `"GREATER"`          |             |
| `"GREATER_OR_EQUAL"` |             |
| `"SMALLER_OR_EQUAL"` |             |
| `"SMALLER"`          |             |
| `"LONGER"`           |             |

## referenceValue

The value the field from scope is compared against

`referenceValue`

*   is required

*   Type: merged type ([Details](show_on-properties-referencevalue.md))

*   cannot be null

*   defined in: [ShowOn property](show_on-properties-referencevalue.md "https://educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/referenceValue")

### referenceValue Type

merged type ([Details](show_on-properties-referencevalue.md))

one (and only one) of

*   [Untitled boolean in ShowOn property](show_on-properties-referencevalue-oneof-0.md "check type definition")

*   [Untitled string in ShowOn property](show_on-properties-referencevalue-oneof-1.md "check type definition")

*   [Untitled number in ShowOn property](show_on-properties-referencevalue-oneof-2.md "check type definition")

# Buttongroup Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/buttongroup.schema.json
```

Used to group buttons

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                           |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :----------------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [buttongroup.schema.json](../schemas/buttongroup.schema.json "open original schema") |

## Buttongroup Type

`object` ([Buttongroup](buttongroup.md))

# Buttongroup Properties

| Property              | Type      | Required | Nullable       | Defined by                                                                                                                                        |
| :-------------------- | :-------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| [type](#type)         | `string`  | Required | cannot be null | [Buttongroup](buttongroup-properties-type.md "https://educorvi.github.io/vue_json_form/schemas/buttongroup.schema.json#/properties/type")         |
| [buttons](#buttons)   | `array`   | Required | cannot be null | [Buttongroup](buttongroup-properties-buttons.md "https://educorvi.github.io/vue_json_form/schemas/buttongroup.schema.json#/properties/buttons")   |
| [vertical](#vertical) | `boolean` | Optional | cannot be null | [Buttongroup](buttongroup-properties-vertical.md "https://educorvi.github.io/vue_json_form/schemas/buttongroup.schema.json#/properties/vertical") |

## type



`type`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Buttongroup](buttongroup-properties-type.md "https://educorvi.github.io/vue_json_form/schemas/buttongroup.schema.json#/properties/type")

### type Type

`string`

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value           | Explanation |
| :-------------- | :---------- |
| `"Buttongroup"` |             |

## buttons

The buttons in the button group

`buttons`

*   is required

*   Type: `object[]` ([Button](buttongroup-properties-buttons-button.md))

*   cannot be null

*   defined in: [Buttongroup](buttongroup-properties-buttons.md "https://educorvi.github.io/vue_json_form/schemas/buttongroup.schema.json#/properties/buttons")

### buttons Type

`object[]` ([Button](buttongroup-properties-buttons-button.md))

### buttons Constraints

**minimum number of items**: the minimum number of items for this array is: `1`

## vertical

Display the buttons vertical

`vertical`

*   is optional

*   Type: `boolean`

*   cannot be null

*   defined in: [Buttongroup](buttongroup-properties-vertical.md "https://educorvi.github.io/vue_json_form/schemas/buttongroup.schema.json#/properties/vertical")

### vertical Type

`boolean`

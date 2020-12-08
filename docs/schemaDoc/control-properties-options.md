# Options Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options
```

Gives multiple options to configure the element


| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                     |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------------------ |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [control.schema.json\*](../schemas/control.schema.json "open original schema") |

## options Type

`object` ([Options](control-properties-options.md))

# Options Properties

| Property                      | Type      | Required | Nullable       | Defined by                                                                                                                                                                                |
| :---------------------------- | --------- | -------- | -------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [multi](#multi)               | Merged    | Optional | cannot be null | [Control](control-properties-options-properties-multi.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/multi")                |
| [rating](#rating)             | `boolean` | Optional | cannot be null | [Control](control-properties-options-properties-rating.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/rating")              |
| [placeholder](#placeholder)   | `string`  | Optional | cannot be null | [Control](control-properties-options-properties-placeholder.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/placeholder")    |
| [enumTitles](#enumtitles)     | `object`  | Optional | cannot be null | [Control](control-properties-options-properties-titles-for-enum.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/enumTitles") |
| [radiobuttons](#radiobuttons) | `boolean` | Optional | cannot be null | [Control](control-properties-options-properties-radiobuttons.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/radiobuttons")  |
| [stacked](#stacked)           | `boolean` | Optional | cannot be null | [Control](control-properties-options-properties-stacked.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/stacked")            |
| [append](#append)             | `string`  | Optional | cannot be null | [Control](control-properties-options-properties-append.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/append")              |

## multi

If set true, textarea will be shown instead of textfield. 
 Alternatively can be set to the number of wanted lines


`multi`

-   is optional
-   Type: merged type ([Details](control-properties-options-properties-multi.md))
-   cannot be null
-   defined in: [Control](control-properties-options-properties-multi.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/multi")

### multi Type

merged type ([Details](control-properties-options-properties-multi.md))

one (and only one) of

-   [Untitled boolean in Control](control-properties-options-properties-multi-oneof-0.md "check type definition")
-   [Untitled integer in Control](control-properties-options-properties-multi-oneof-1.md "check type definition")

## rating

If set to true, numberfield will appear as star-rating-field


`rating`

-   is optional
-   Type: `boolean`
-   cannot be null
-   defined in: [Control](control-properties-options-properties-rating.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/rating")

### rating Type

`boolean`

## placeholder

Will be shown as placeholder in form fields, if supported by field


`placeholder`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Control](control-properties-options-properties-placeholder.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/placeholder")

### placeholder Type

`string`

## enumTitles

If the text in a enums select field is supposed to differ from the keys, they can be specified as properties of this object. The value in the enum must be used as property name


`enumTitles`

-   is optional
-   Type: `object` ([Titles for enum](control-properties-options-properties-titles-for-enum.md))
-   cannot be null
-   defined in: [Control](control-properties-options-properties-titles-for-enum.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/enumTitles")

### enumTitles Type

`object` ([Titles for enum](control-properties-options-properties-titles-for-enum.md))

## radiobuttons

If set to true, a group of radiobuttons will be shown instead of the select field


`radiobuttons`

-   is optional
-   Type: `boolean`
-   cannot be null
-   defined in: [Control](control-properties-options-properties-radiobuttons.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/radiobuttons")

### radiobuttons Type

`boolean`

## stacked

Radiobutton-/Checkbox group will be stacked if set to true


`stacked`

-   is optional
-   Type: `boolean`
-   cannot be null
-   defined in: [Control](control-properties-options-properties-stacked.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/stacked")

### stacked Type

`boolean`

## append

Will be appended to field


`append`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Control](control-properties-options-properties-append.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/control.schema.json#/properties/options/properties/append")

### append Type

`string`

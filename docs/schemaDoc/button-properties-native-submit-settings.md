# Native Submit Settings Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/nativeSubmitSettings
```

Settings if native form submit is used

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                   |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :--------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [button.schema.json\*](../schemas/button.schema.json "open original schema") |

## nativeSubmitSettings Type

`object` ([Native Submit Settings](button-properties-native-submit-settings.md))

# nativeSubmitSettings Properties

| Property                    | Type     | Required | Nullable       | Defined by                                                                                                                                                                                                 |
| :-------------------------- | :------- | :------- | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [formaction](#formaction)   | `string` | Optional | cannot be null | [Button](button-properties-native-submit-settings-properties-formaction.md "https://educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/nativeSubmitSettings/properties/formaction")   |
| [formmethod](#formmethod)   | `string` | Optional | cannot be null | [Button](button-properties-native-submit-settings-properties-formmethod.md "https://educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/nativeSubmitSettings/properties/formmethod")   |
| [formtarget](#formtarget)   | `string` | Optional | cannot be null | [Button](button-properties-native-submit-settings-properties-formtarget.md "https://educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/nativeSubmitSettings/properties/formtarget")   |
| [formenctype](#formenctype) | `string` | Optional | cannot be null | [Button](button-properties-native-submit-settings-properties-formenctype.md "https://educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/nativeSubmitSettings/properties/formenctype") |

## formaction

Specifies where to send the form-data when a form is submitted

`formaction`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Button](button-properties-native-submit-settings-properties-formaction.md "https://educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/nativeSubmitSettings/properties/formaction")

### formaction Type

`string`

## formmethod

Specifies how to send the form-data

`formmethod`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Button](button-properties-native-submit-settings-properties-formmethod.md "https://educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/nativeSubmitSettings/properties/formmethod")

### formmethod Type

`string`

### formmethod Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value    | Explanation |
| :------- | :---------- |
| `"get"`  |             |
| `"post"` |             |

## formtarget

Specifies where to display the response after submitting the form

`formtarget`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Button](button-properties-native-submit-settings-properties-formtarget.md "https://educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/nativeSubmitSettings/properties/formtarget")

### formtarget Type

`string`

### formtarget Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value       | Explanation |
| :---------- | :---------- |
| `"_blank"`  |             |
| `"_self"`   |             |
| `"_parent"` |             |
| `"_top"`    |             |

## formenctype

Specifies how form-data should be encoded before sending it to a server

`formenctype`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Button](button-properties-native-submit-settings-properties-formenctype.md "https://educorvi.github.io/vue_json_form/schemas/button.schema.json#/properties/nativeSubmitSettings/properties/formenctype")

### formenctype Type

`string`

### formenctype Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value                                 | Explanation |
| :------------------------------------ | :---------- |
| `"application/x-www-form-urlencoded"` |             |
| `"multipart/form-data"`               |             |
| `"text/plain"`                        |             |

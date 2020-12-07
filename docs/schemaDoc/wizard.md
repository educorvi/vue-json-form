# Wizard Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/wizard.schema.json
```

A wizard that contains the form spread over multiple pages


| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                 |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | -------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [wizard.schema.json](../schemas/wizard.schema.json "open original schema") |

## Wizard Type

`object` ([Wizard](wizard.md))

# Wizard Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                                              |
| :-------------------- | -------- | -------- | -------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| [type](#type)         | `string` | Required | cannot be null | [Wizard](wizard-properties-type.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard.schema.json#/properties/type")         |
| [title](#title)       | `string` | Optional | cannot be null | [Wizard](wizard-properties-title.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard.schema.json#/properties/title")       |
| [subtitle](#subtitle) | `string` | Optional | cannot be null | [Wizard](wizard-properties-subtitle.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard.schema.json#/properties/subtitle") |
| [pages](#pages)       | `array`  | Required | cannot be null | [Wizard](wizard-properties-pages.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard.schema.json#/properties/pages")       |
| [$schema](#schema)    | `string` | Optional | cannot be null | [Wizard](wizard-properties-schema.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard.schema.json#/properties/$schema")    |

## type




`type`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [Wizard](wizard-properties-type.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard.schema.json#/properties/type")

### type Type

`string`

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value      | Explanation |
| :--------- | ----------- |
| `"Wizard"` |             |

## title

The Wizards title


`title`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Wizard](wizard-properties-title.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard.schema.json#/properties/title")

### title Type

`string`

## subtitle

The Wizards subtitle


`subtitle`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Wizard](wizard-properties-subtitle.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard.schema.json#/properties/subtitle")

### subtitle Type

`string`

## pages




`pages`

-   is required
-   Type: `object[]` ([Wizard Page](wizard-properties-pages-wizard-page.md))
-   cannot be null
-   defined in: [Wizard](wizard-properties-pages.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard.schema.json#/properties/pages")

### pages Type

`object[]` ([Wizard Page](wizard-properties-pages-wizard-page.md))

## $schema

May contain a link to the uischema


`$schema`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Wizard](wizard-properties-schema.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard.schema.json#/properties/$schema")

### $schema Type

`string`

# Wizard Page Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/pages/items
```




| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                   |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | ---------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [wizard.schema.json\*](../schemas/wizard.schema.json "open original schema") |

## items Type

`object` ([Wizard Page](wizard-properties-pages-wizard-page.md))

# Wizard Page Properties

| Property            | Type     | Required | Nullable       | Defined by                                                                                                                                           |
| :------------------ | -------- | -------- | -------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| [title](#title)     | `string` | Required | cannot be null | [Wizard Page](wizard_page-properties-title.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/title")     |
| [content](#content) | Merged   | Required | cannot be null | [Wizard Page](wizard_page-properties-content.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/content") |

## title




`title`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [Wizard Page](wizard_page-properties-title.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/title")

### title Type

`string`

## content




`content`

-   is required
-   Type: merged type ([Details](wizard_page-properties-content.md))
-   cannot be null
-   defined in: [Wizard Page](wizard_page-properties-content.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/content")

### content Type

merged type ([Details](wizard_page-properties-content.md))

one (and only one) of

-   [Control](layout-properties-elements-layoutelement-oneof-control.md "check type definition")
-   [Layout](layout-properties-elements-layoutelement-oneof-layout.md "check type definition")
-   [HTML Renderer](layout-properties-elements-layoutelement-oneof-html-renderer.md "check type definition")

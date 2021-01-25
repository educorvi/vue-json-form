# Wizard Page Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/pages/items
```



| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                  |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [wizard.schema.json*](../schemas/wizard.schema.json "open original schema") |

## items Type

`object` ([Wizard Page](wizard-properties-pages-wizard-page.md))

# Wizard Page Properties

| Property              | Type      | Required | Nullable       | Defined by                                                                                                                                                       |
| :-------------------- | :-------- | :------- | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [title](#title)       | `string`  | Required | cannot be null | [Wizard Page](wizard_page-properties-title.md "https://educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/title")                      |
| [hideNext](#hidenext) | `boolean` | Optional | cannot be null | [Wizard Page](wizard_page-properties-hide-next-button.md "https://educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/hideNext")        |
| [nextText](#nexttext) | `string`  | Optional | cannot be null | [Wizard Page](wizard_page-properties-text-of-the-next-button.md "https://educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/nextText") |
| [content](#content)   | Merged    | Required | cannot be null | [Wizard Page](wizard_page-properties-content.md "https://educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/content")                  |

## title



`title`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Wizard Page](wizard_page-properties-title.md "https://educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/title")

### title Type

`string`

## hideNext

You can use this for example, if you want to use the last page for a submit button

`hideNext`

*   is optional

*   Type: `boolean` ([Hide "Next" Button](wizard_page-properties-hide-next-button.md))

*   cannot be null

*   defined in: [Wizard Page](wizard_page-properties-hide-next-button.md "https://educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/hideNext")

### hideNext Type

`boolean` ([Hide "Next" Button](wizard_page-properties-hide-next-button.md))

## nextText

Changes the text of the next button

`nextText`

*   is optional

*   Type: `string` ([Text of the "Next" Button](wizard_page-properties-text-of-the-next-button.md))

*   cannot be null

*   defined in: [Wizard Page](wizard_page-properties-text-of-the-next-button.md "https://educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/nextText")

### nextText Type

`string` ([Text of the "Next" Button](wizard_page-properties-text-of-the-next-button.md))

### nextText Default Value

The default value is:

```json
"Next"
```

## content



`content`

*   is required

*   Type: merged type ([Details](wizard_page-properties-content.md))

*   cannot be null

*   defined in: [Wizard Page](wizard_page-properties-content.md "https://educorvi.github.io/vue_json_form/schemas/wizard_page.schema.json#/properties/content")

### content Type

merged type ([Details](wizard_page-properties-content.md))

one (and only one) of

*   [Control](layout-properties-elements-layoutelement-oneof-control.md "check type definition")

*   [Layout](layout-properties-elements-layoutelement-oneof-layout.md "check type definition")

*   [HTML Renderer](layout-properties-elements-layoutelement-oneof-html-renderer.md "check type definition")

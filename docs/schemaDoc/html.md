# HTML Renderer Schema

```txt
https://educorvi.github.io/vue_json_form/schemas/html.schema.json
```

Some HTML to be rendered in the form


| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                             |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | ---------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [html.schema.json](../schemas/html.schema.json "open original schema") |

## HTML Renderer Type

`object` ([HTML Renderer](html.md))

# HTML Renderer Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                                                            |
| :-------------------- | -------- | -------- | -------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [type](#type)         | `string` | Optional | cannot be null | [HTML Renderer](html-properties-type.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/html.schema.json#/properties/type")                    |
| [htmlData](#htmldata) | `string` | Required | cannot be null | [HTML Renderer](html-properties-htmldata.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/html.schema.json#/properties/htmlData")            |
| [showOn](#showon)     | `object` | Optional | cannot be null | [HTML Renderer](control-properties-showon-property.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/showOn") |

## type




`type`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [HTML Renderer](html-properties-type.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/html.schema.json#/properties/type")

### type Type

`string`

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value    | Explanation |
| :------- | ----------- |
| `"HTML"` |             |

## htmlData




`htmlData`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [HTML Renderer](html-properties-htmldata.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/html.schema.json#/properties/htmlData")

### htmlData Type

`string`

## showOn

Show field depending on value of other field


`showOn`

-   is optional
-   Type: `object` ([ShowOn property](control-properties-showon-property.md))
-   cannot be null
-   defined in: [HTML Renderer](control-properties-showon-property.md "https&#x3A;//educorvi.github.io/vue_json_form/schemas/show_on.schema.json#/properties/showOn")

### showOn Type

`object` ([ShowOn property](control-properties-showon-property.md))

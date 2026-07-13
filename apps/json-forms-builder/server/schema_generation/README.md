```mermaid
flowchart TD
    A[plain JSON from DB / API]
    A -->|ObjectElement.parse| B[Validated plain object]
    B -->|fromJSON| C[Real StringElement / ObjectElement / ...]
    C -->|JSON.stringify| A

    C --> D[toJsonSchema]
    C --> E[toUiSchema]
    D --> F[JsonSchema]
    E --> G[UiSchema]
    F & G -->|fromJsonAndUiSchema| C
```


```
//// Example

const raw_json = JSON.parse(dbValue);

// Throws if invalid
const formObject = fromJSON(raw_json);

const json_schema = formObject.toJsonSchema();
const ui_schema = formObject.toUiSchema();

const formObject2 = fromJsonSchemaAndUiSchema(jsonschema, uischema);
// formObject and formObject2 are identical

const json = JSON.stringify(formObject)
```
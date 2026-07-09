plain JSON from DB / API ▼-------------------------------------------------
        │                                                                 │
ObjectElement.parse(json) // the root object = the form                   │
        │                                                                 │
        ▼                                                                 │
Validated plain object                                                    │
        │                                                                 │
fromJSON(...)                                                             │
        │                                                                 │
        ▼                                                                 │
Real StringElement / ObjectElement / ...                                  │
        │                                                                 │
JSON.stringify(...)                                                       │
        │                                                                 │
        -------------------------------------------------------------------




Real StringElement / ObjectElement / ... ▼-----------------
        │                           │                     │
toJsonSchema()               toUiSchema()                 │
        │                           │                     │
        ▼                           ▼                     │
JsonSchema                    UiSchema                    │
        │                           │                     │
    fromJsonAndUiSchema(...............)                  │
                    │                                     │
                    ---------------------------------------



//// Example
const raw = JSON.parse(dbValue);

// Throws if invalid
const dto = FormElementSchema.parse(raw);

// Safe to reconstruct
const element = FormElementFactory.fromJSON(dto);
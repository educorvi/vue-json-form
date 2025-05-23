# Breaking Changes in the UI Schema

## v2

### General

- Scopes output changed format for arrays. Now arrays are returned as `"../array-name[i]": "value"`, where `i` is the
  index.
- Do NOT use `.`,`[` or `]` in names for a field.

### Root Schema

Instead of starting with any layout, the root object of the schema now needs to fields:

- `version`: defines the version of the schema (currently 2.0)
- `layout`: contains an object with the root layout (root of schema version 1)

### Buttongroup

`vertical` was moved into `options`

### Button

- `variant` was moved into `options`.
- `ǹativeSubmitSettings` were removed since native submit is not supported anymore. Instead, `options.submitOptions` allows to pass submit options to the surrounding app.

### Control

- `scope` is now defined without the leading `#`
- `format` was moved into `options`
- `options.drop-placeholder` was removed. Instead, use the normal `options.placeholder`.
- Possible values for `options.format` are now:
    - "text"
    - "time"
    - "date"
    - "datetime-local"
    - "email"
    - "password"
    - "search"
    - "url"
    - "tel"
    - "color"
    - "hidden" (not the same as `options.hidden`, this one only hides the input, not the whole control)
- star rating field was removed
- To display enums as radiobuttons or as switches instead of a select dropdown, the `options.displayAs` property is used instead of `options.radiobuttons`/`options.switch`.

### Layouts (Group, VerticalLayout & HorizontalLayout)

`label` (for groups) was moved into `options`

### ShowOn

`showOn` now uses object notation instead of the scope to access data (e.g. `files[0].name`). For that `scope` in
`showOn` was renamed to `path`.
Also, in the legacy version, `LONGER` is no longer supported.

### Wizard

Wizard was dropped

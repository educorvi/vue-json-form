# Breaking Changes in the UI Schema
## v2
### Root Schema
Instead of starting with any layout, the root object of the schema now needs to fields:
- `version`: defines the version of the schema (currently 2.0)
- `layout`: contains an object with the root layout (root of schema version 1)
### Buttongroup
`vertical` was moved into `options`
### Button
`variant` and `nativeSubmitSettings` were moved into `options`
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
### Layouts (Group, VerticalLayout & HorizontalLayout)
`label` (for groups) was moved into `options`
### Wizard
Wizard was dropped
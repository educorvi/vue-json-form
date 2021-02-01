# FormField

import Array from "./Array.vue"; import Boolean from "./Boolean.vue"; import MultibleChoice from "./MultibleChoice.vue"; import Number from "./Number.vue"; import Object from "./Object.vue"; import Select from "./Select.vue"; import String from "./String.vue"; import defaultField from "./defaultField.vue"; import Radiobuttons from "./Radiobuttons.vue"; import Tags from "./Tags.vue"; import File from "./File.vue"; This is the main form-field, that is always referenced. It decides, which field needs to be rendered

## Slots

<!-- @vuese:FormField:slots:start -->
|Name|Description|Default Slot Content|
|---|---|---|
|prepend|Content is prepended to the input field|-|
|default|Content is appended to the input field|-|

<!-- @vuese:FormField:slots:end -->


## MixIns

<!-- @vuese:FormField:mixIns:start -->
|MixIn|
|---|
|formFieldMixin|

<!-- @vuese:FormField:mixIns:end -->



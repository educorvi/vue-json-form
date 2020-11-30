# FormRoot

This is the Root Component and the interface to the "outside". Generates UI if necessary and renders form. When submitted (for example by slot with `type=submit` in the default slot), a call of the method passed in prop `onSubmit` will be triggered, passing the data as first argument

## Props

<!-- @vuese:FormRoot:props:start -->
|Name|Description|Type|Required|Default|
|---|---|---|---|---|
|disableValidation|Disables the validation of json-schema and ui-schema|`Boolean`|`false`|false|
|onSubmit|Method that is called, when the Form is submitted. Passes the formdata as first Argument|`Function`|`true`|-|

<!-- @vuese:FormRoot:props:end -->


## Slots

<!-- @vuese:FormRoot:slots:start -->
|Name|Description|Default Slot Content|
|---|---|---|
|default|Slot inside the form below the generated content. Meant for Submit Button and similar additions|`<input type="submit" class="float-right btn btn-primary"/>`|

<!-- @vuese:FormRoot:slots:end -->


## MixIns

<!-- @vuese:FormRoot:mixIns:start -->
|MixIn|
|---|
|rootProps|

<!-- @vuese:FormRoot:mixIns:end -->



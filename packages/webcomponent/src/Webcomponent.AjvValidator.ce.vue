<script setup lang="ts">
import {
    bootstrapComponents,
    VueJsonForm as vjfComp,
} from '@educorvi/vue-json-form';
import {
    IfThenElseMapper,
    OneOfToEnumMapper,
    RitaDependentOptionsMapper,
    DependentRequiredMapper,
} from '@educorvi/vue-json-form';
import { getComputed, getSubmitFunc, type Props, type Emits } from './vueComponentCommons.ts';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';

const props = defineProps<Props & { noValidate?: boolean }>();

const emit = defineEmits<Emits>();

const { jsonSchema, uiSchema, presetData, returnDataAsScopes } = getComputed(props);

const mappers = [OneOfToEnumMapper, IfThenElseMapper, RitaDependentOptionsMapper, DependentRequiredMapper];

const onSubmitForm = getSubmitFunc(emit);
</script>

<template>
    <vjf-comp
        v-if="jsonSchema"
        :json-schema="jsonSchema"
        :ui-schema="uiSchema"
        :preset-data="presetData"
        :return-data-as-scopes="returnDataAsScopes"
        :mappers="mappers"
        :validator="noValidate?undefined:AjvValidator"
        :onSubmitForm="onSubmitForm"
        :render-interface="bootstrapComponents"
    >
        <slot />
    </vjf-comp>
</template>

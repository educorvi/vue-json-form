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
import {
    getComputed,
    getSubmitFunc,
    type Props,
    type Emits,
} from './vueComponentCommons.ts';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
import { computed, useTemplateRef } from 'vue';
import ResultModal from '@/ResultModal.vue';

const props = defineProps<Props & { noValidate?: boolean }>();

const emit = defineEmits<Emits>();

const { jsonSchema, uiSchema, presetData, returnDataAsScopes } =
    getComputed(props);

const mappers = [
    OneOfToEnumMapper,
    IfThenElseMapper,
    RitaDependentOptionsMapper,
    DependentRequiredMapper,
];

const resultModal = useTemplateRef('resultModal');

const onSubmitForm = computed(() =>
    getSubmitFunc(emit, resultModal.value?.updateStage)
);
</script>

<template>
    <vjf-comp
        v-if="jsonSchema"
        :json-schema="jsonSchema"
        :ui-schema="uiSchema"
        :preset-data="presetData"
        :return-data-as-scopes="returnDataAsScopes"
        :mappers="mappers"
        :validator="noValidate ? undefined : AjvValidator"
        :on-submit-form="onSubmitForm"
        :render-interface="bootstrapComponents"
    >
        <slot />
    </vjf-comp>
    <ResultModal ref="resultModal" />
</template>

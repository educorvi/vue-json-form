<script setup lang="ts">
import {
    bootstrapComponents,
    DependentRequiredMapper,
    VueJsonForm as vjfComp,
} from '@educorvi/vue-json-form';
import {
    IfThenElseMapper,
    OneOfToEnumMapper,
    RitaDependentOptionsMapper,
} from '@educorvi/vue-json-form';
import {
    getComputed,
    getSubmitFunc,
    type Props,
    type Emits,
} from './vueComponentCommons.ts';
import ResultModal from '@/ResultModal.vue';
import { computed, useTemplateRef } from 'vue';

const props = defineProps<Props>();

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

const onSubmitForm = computed(() => getSubmitFunc(emit, resultModal.value));
</script>

<template>
    <body>
        <vjf-comp
            v-if="jsonSchema"
            :json-schema="jsonSchema"
            :ui-schema="uiSchema"
            :preset-data="presetData"
            :return-data-as-scopes="returnDataAsScopes"
            :mappers="mappers"
            :on-submit-form="onSubmitForm"
            :render-interface="bootstrapComponents"
        >
            <slot />
        </vjf-comp>
        <ResultModal ref="resultModal" />
    </body>
</template>

<script setup lang="ts">
import {
    VueJsonForm as vjfComp,
} from '@educorvi/vue-json-form';
import { IfThenElseMapper, OneOfToEnumMapper, RitaDependentOptionsMapper } from '@educorvi/vue-json-form';
import { getComputed, getSubmitFunc, type Props, type Emits } from './vueComponentCommons.ts';

const props = defineProps<Props>();

const emit = defineEmits<Emits>();

const { jsonSchema, uiSchema, presetData, returnDataAsScopes } = getComputed(props);

const mappers = [OneOfToEnumMapper, IfThenElseMapper, RitaDependentOptionsMapper];

const onSubmitForm = getSubmitFunc(emit);
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
        :onSubmitForm="onSubmitForm"
    >
        <slot />
    </vjf-comp>
    </body>
</template>

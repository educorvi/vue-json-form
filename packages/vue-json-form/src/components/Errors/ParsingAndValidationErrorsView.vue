<template>
    <h4>Error</h4>
    <p>There were errors while rendering this form</p>
    <div v-if="validationErrors.general.length">
        <h5>General</h5>
        <ParsingError
            v-for="error in validationErrors.general"
            :key="error.message"
            :error="error"
        />
    </div>

    <h5 v-if="jsonError">JSON Schema</h5>
    <div v-if="validationErrors.jsonSchema.parsing.length > 0">
        <h6>Parsing errors</h6>
        <ParsingError
            v-for="error in validationErrors.jsonSchema.parsing"
            :key="error.message"
            :error="error"
        />
    </div>
    <div v-if="validationErrors.jsonSchema.validation.length > 0">
        <h6>Validation errors</h6>
        <ValidationError
            v-for="error in validationErrors.jsonSchema.validation"
            :key="error.message + error.path"
            :error="error"
        />
    </div>
    <h5 class="mt-4" v-if="uiError">UI Schema</h5>
    <div v-if="validationErrors.uiSchema.parsing.length > 0">
        <h6>Parsing errors</h6>
        <ParsingError
            v-for="error in validationErrors.uiSchema.parsing"
            :key="error.message"
            :error="error"
        />
    </div>
    <div v-if="validationErrors.uiSchema.validation.length > 0">
        <h6>Validation errors</h6>
        <ValidationError
            v-for="error in validationErrors.uiSchema.validation"
            :key="error.message + error.path"
            :error="error"
        />
    </div>
</template>
<script setup lang="ts">
import ValidationError from '@/components/Errors/ValidationError.vue';
import type { ValidationErrors } from '@educorvi/vue-json-form-schemas';
import { computed } from 'vue';
import ParsingError from '@/components/Errors/ParsingError.vue';

const props = defineProps<{
    validationErrors: ValidationErrors<unknown>;
}>();

const jsonError = computed(() => {
    return !!(
        props.validationErrors.jsonSchema.parsing.length +
        props.validationErrors.jsonSchema.validation.length
    );
});
const uiError = computed(() => {
    return !!(
        props.validationErrors.uiSchema.parsing.length +
        props.validationErrors.uiSchema.validation.length
    );
});
</script>

import { computed, inject, ref, type Ref, watch } from 'vue';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import { validateNumberInput } from '@/formControlInputValidation/NumberValidation.ts';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
import { storeToRefs } from 'pinia';
import { languageProviderKey } from '@/components/ProviderKeys.ts';

/**
 * Returns a computed ref of the `step` attribute value for a numeric input.
 *
 * Resolution order:
 * - Uses `jsonElement.multipleOf` when set.
 * - Falls back to `1` for `integer` schemas (no fractional input).
 * - Falls back to an extremely small value (`1e-22`) for `number` schemas so
 *   that the browser accepts any decimal input.
 *
 * @param jsonElement - Readonly ref to the JSON Schema element.
 * @returns A computed ref of the step value.
 */
export function getStep(jsonElement: Readonly<Ref<JSONSchema>>) {
    return computed(() => {
        if (jsonElement.value.type === 'integer') {
            return jsonElement.value.multipleOf || 1;
        }
        return jsonElement.value.multipleOf || 'any';
    });
}

export function setupValueAndValidation(
    jsonElement: Readonly<Ref<JSONSchema>>,
    id: string,
    required: boolean
) {
    const { savePath } = injectJsonData();
    const { formDataStore } = getStores();
    const { formData } = storeToRefs(formDataStore);

    const value = ref<string | undefined>(undefined);

    watch(value, () => {
        formData.value[savePath] = Number(value.value);
    });

    const state = getComputedValidationState(jsonElement, id, required, value);
    return { state, value };
}

export function getComputedValidationState(
    jsonElement: Readonly<Ref<JSONSchema>>,
    id: string,
    required: boolean,
    value: Ref<string | undefined>
) {
    const { formStructureStore } = getStores();
    const { formStateWasValidated } = storeToRefs(formStructureStore);
    const languageProvider = inject(languageProviderKey);

    const valid = ref(true);
    watch(
        value,
        () => {
            valid.value = validateNumberInput(
                jsonElement.value,
                value.value,
                languageProvider,
                document.getElementById(id) as HTMLInputElement | null,
                required
            );
        },
        { immediate: true }
    );

    return computed(() => {
        if (formStateWasValidated.value) {
            return valid.value;
        } else {
            return undefined;
        }
    });
}

import { watch, type Ref } from 'vue';
import type { FormBuilder } from '../useFormBuilder';

const emptyUiSchema = {
    version: '2.0',
    layout: { type: 'VerticalLayout', elements: [] },
};

/** Import the initial {json, ui} schema props into the builder (local mode only). */
export function useSchemaImport(
    builder: FormBuilder,
    jsonSchema: Ref<string | undefined>,
    uiSchema: Ref<string | undefined>,
    enabled: Ref<boolean>
): void {
    watch(
        [jsonSchema, uiSchema],
        () => {
            if (!enabled.value || !jsonSchema.value) return;
            try {
                const json = JSON.parse(jsonSchema.value);
                const ui = uiSchema.value
                    ? JSON.parse(uiSchema.value)
                    : emptyUiSchema;
                builder.loadFromJsonUi(json, ui);
            } catch (err) {
                console.error(
                    'Failed to import jsonSchema/uiSchema props:',
                    err
                );
            }
        },
        { immediate: true }
    );
}

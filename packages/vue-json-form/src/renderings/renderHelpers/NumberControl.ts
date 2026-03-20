import { computed, type Ref } from 'vue';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';

export function getStep(jsonElement: Readonly<Ref<JSONSchema>>) {
    return computed(() => {
        if (jsonElement.value.type === 'integer') {
            return jsonElement.value.multipleOf || 1;
        }
        return jsonElement.value.multipleOf || 0.0000000000000000000001;
    });
}

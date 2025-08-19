import { computed } from 'vue';
import type { Control } from '@educorvi/vue-json-form-schemas';
export function controlID(savePath: string) {
    return computed(() => ('vjf_control_for_' + savePath).replace(/\//g, '_'));
}

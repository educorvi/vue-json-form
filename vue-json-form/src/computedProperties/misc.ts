import { computed } from 'vue';
import type { Control } from '@/typings/ui-schema';
export function controlID(savePath: string) {
    return computed(() => ('vjf_control_for_' + savePath).replace(/\//g, '_'));
}

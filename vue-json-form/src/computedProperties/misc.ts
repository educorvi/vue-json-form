import { computed } from 'vue';
import type { Control } from '@/typings/ui-schema';
export function controlID(control: Control) {
    return computed(() => 'vjf_control_for_' + control.scope);
}

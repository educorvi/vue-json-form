import { computed } from 'vue';
export function controlID(savePath: string) {
    return computed(() => ('vjf_control_for_' + savePath).replace(/\//g, '_'));
}
export function getRandomId() {
    return Math.random().toString(36).substring(7);
}

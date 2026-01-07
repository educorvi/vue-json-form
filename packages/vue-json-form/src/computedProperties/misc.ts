import { computed, type ComputedRef } from 'vue';

/**
 * Generates a computed control HTML ID based on the provided save path.
 * The control ID is a string prefixed with "vjf_control_for_" followed by
 * the save path, where all forward slashes are replaced with underscores.
 *
 * @param {string} savePath - The save path used to generate the control ID.
 * @return {ComputedRef<string>} A computed reference containing the generated control ID.
 */
export function controlID(savePath: string): ComputedRef<string> {
    return computed(() => ('vjf_control_for_' + savePath).replace(/\//g, '_'));
}

/**
 * Generates a random alphanumeric string id.
 *
 * @return {string} A randomly generated alphanumeric identifier.
 */
export function getRandomId(): string {
    return Math.random().toString(36).substring(7);
}

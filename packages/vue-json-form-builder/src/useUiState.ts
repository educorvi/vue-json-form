/**
 * Shared UI state for the builder chrome (theme + inline preview), mirroring
 * the legacy formStore's themeMode / isPreviewInline refs.
 */
import { ref } from 'vue';

export type ThemeMode = 'light' | 'dark';

const themeMode = ref<ThemeMode>('light');
const isPreviewInline = ref(false);

export function useUiState() {
    return { themeMode, isPreviewInline };
}

export function setThemeMode(mode: ThemeMode): void {
    themeMode.value = mode;
    if (mode === 'dark') {
        document.documentElement.classList.add('my-app-dark');
    } else {
        document.documentElement.classList.remove('my-app-dark');
    }
}

export function togglePreviewInline(): void {
    isPreviewInline.value = !isPreviewInline.value;
}

/**
 * preferences – Shared user preference store (theme + language).
 *
 * Both preferences behave the same way:
 * - SSR-friendly: the initial value is deterministic on the server AND on
 *   the client (cookie-backed), so the first render matches on both sides
 *   (no hydration mismatch, no flash, no ClientOnly needed).
 * - Persisted across visits: theme in the `theme` cookie, language in the
 *   i18n cookie (managed by @nuxtjs/i18n's `setLocale`).
 *
 * Components stay thin:
 * - `ThemeSwitcher` only calls `cycleTheme()` and renders state.
 * - `LocaleSwitcher` only reads `locales` / `locale` and calls
 *   `changeLocale()`.
 *
 * The resolved theme is bound to `<html data-bs-theme>` in `app.vue`
 * (Nuxt `<Html>` builtin), so no component touches the DOM directly.
 */
import { defineStore } from 'pinia';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_CYCLE: Record<ThemeMode, ThemeMode> = {
    system: 'light',
    light: 'dark',
    dark: 'system',
};

const LOCALE_FLAGS: Record<string, string> = {
    en: '🇬🇧',
    de: '🇩🇪',
};

export const usePreferencesStore = defineStore('preferences', () => {
    // ── Theme ────────────────────────────────────────────────────────────────

    /** Persisted mode (plain-string cookie, backwards compatible). */
    const themeCookie = useCookie<ThemeMode>('theme', {
        default: () => 'system',
    });
    const themeMode = ref<ThemeMode>(themeCookie.value);

    /**
     * The theme actually applied to `<html data-bs-theme>` — always
     * 'light' | 'dark'. Deterministic during SSR (`system` → light), so
     * server and client render the identical attribute. `onNuxtReady`
     * corrects `system` to the real OS preference after hydration, and a
     * media-query listener keeps it in sync while `system` is active.
     */
    const resolvedTheme = ref<'light' | 'dark'>(
        themeCookie.value === 'dark' ? 'dark' : 'light'
    );

    const themeIcon = computed(() => {
        switch (themeMode.value) {
            case 'light':
                return 'ph:sun';
            case 'dark':
                return 'ph:moon';
            default:
                return 'ph:monitor';
        }
    });

    function syncResolvedTheme() {
        if (themeMode.value === 'system') {
            resolvedTheme.value =
                import.meta.client &&
                window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light';
        } else {
            resolvedTheme.value = themeMode.value;
        }
    }

    /** system → light → dark → system (and back). */
    function cycleTheme() {
        themeMode.value = THEME_CYCLE[themeMode.value];
    }

    // Persist + re-apply whenever the mode changes (single write path).
    watch(themeMode, (mode) => {
        themeCookie.value = mode;
        syncResolvedTheme();
    });

    if (import.meta.client) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', () => {
            if (themeMode.value === 'system') syncResolvedTheme();
        });
        // Correct `system` to the real OS preference after hydration.
        onNuxtReady(() => syncResolvedTheme());
    }

    // ── Language ─────────────────────────────────────────────────────────────

    const i18n = useI18n();

    /** Current locale code ('en' | 'de'), reactive. */
    const locale = computed(() => i18n.locale.value as string);

    /** Locales configured in nuxt.config (i18n.locales) + display flags. */
    const locales = computed(() =>
        (
            (i18n.locales?.value ?? []) as Array<{
                code: string;
                name?: string;
            }>
        ).map((l) => ({
            code: l.code,
            flag: LOCALE_FLAGS[l.code] ?? '',
            name: l.name ?? l.code,
        }))
    );

    /**
     * Switch the app language. @nuxtjs/i18n persists the choice in its own
     * cookie and updates the composer — nothing else needed.
     */
    function changeLocale(code: string) {
        void i18n.setLocale(code);
    }

    return {
        themeMode,
        resolvedTheme,
        themeIcon,
        cycleTheme,
        locale,
        locales,
        changeLocale,
    };
});

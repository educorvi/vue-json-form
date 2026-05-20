/**
 * theme.client.ts — applies the saved theme class to <html> immediately on
 * the client before any component mounts.  Without this, the ThemeSwitcher
 * component would only apply dark mode the first time the user opens the
 * profile popover, causing a flash of the wrong theme (FOUC).
 */
export default defineNuxtPlugin(() => {
    const saved = localStorage.getItem('theme') ?? 'system';
    const isDark =
        saved === 'dark' ||
        (saved === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
        document.documentElement.classList.add('app-dark');
    } else {
        document.documentElement.classList.remove('app-dark');
    }

    // Keep in sync if the user's OS preference changes while the tab is open
    // and the saved mode is 'system'.
    window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
            if ((localStorage.getItem('theme') ?? 'system') === 'system') {
                document.documentElement.classList.toggle(
                    'app-dark',
                    e.matches
                );
            }
        });
});

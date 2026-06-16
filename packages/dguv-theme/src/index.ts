/**
 * @educorvi/uv-theme – public entry point
 *
 * Usage in consuming apps:
 *   import { UVNexusPreset } from '@educorvi/uv-theme';
 *
 * Vue components (Vite/bundler only, not Node ESM):
 *   import { ThemeSwitcher } from '@educorvi/uv-theme/components';
 *
 * CSS (in main.css, after @import 'tailwindcss'):
 *   @import '@educorvi/uv-theme/styles';
 */
// export { UVNexusPreset } from "./theme/uv-nexus-preset";

import { UVNexusPreset } from './theme';

export { UVNexusPreset };

export default {
    preset: UVNexusPreset,
    options: {
        darkModeSelector: '.app-dark',
    },
};

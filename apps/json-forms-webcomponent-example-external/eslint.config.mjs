// App-level ESLint config: merges the Nuxt-generated config (auto-import
// globals etc., see .nuxt/eslint.config.mjs) with the repo's shared root
// config (../../eslint.config.mjs).
import { withNuxt } from './.nuxt/eslint.config.mjs';
import rootConfig from '../../eslint.config.mjs';

export default withNuxt(
    // Synced build output of the form-builder webcomponent — third-party
    // minified code, not linted.
    { ignores: ['public/vendor/**'] },
    ...rootConfig,
);

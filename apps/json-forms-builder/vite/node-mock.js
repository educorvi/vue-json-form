/**
 * Empty mock for Node.js built-in modules.
 *
 * When dependencies like `sanitize-html` → `postcss` reference Node.js builtins
 * (path, fs, url, source-map-js), Vite externalizes them for browser safety
 * which causes runtime errors. This mock provides a safe empty module so that
 * the importing code doesn't crash — the source-map features that require
 * these modules are never exercised in browser contexts.
 */
export default {};
module.exports = {};

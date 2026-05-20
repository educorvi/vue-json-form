import { addons } from "storybook/manager-api";
import { themes } from "storybook/theming";

/**
 * Storybook manager (chrome / UI) theme.
 *
 * Set once at startup based on the OS colour-scheme preference.
 * The canvas dark mode is controlled separately by the "Color scheme"
 * toolbar button defined in preview.ts — this file only themes the chrome.
 */
addons.setConfig({
  theme: window.matchMedia("(prefers-color-scheme: dark)").matches
    ? themes.dark
    : themes.light,
});

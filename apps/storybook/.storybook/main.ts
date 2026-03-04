import type { StorybookConfig } from "@storybook/vue3-vite";
import { join, dirname } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    framework: {
        name: getAbsolutePath("@storybook/vue3-vite"),
        options: {},
    },
    docs: {
        autodocs: "tag",
    },
};
export default config;

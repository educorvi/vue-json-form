import { type Preview, setup } from "@storybook/vue3";
import { type App, provide, ref, watch } from 'vue';
import { createPinia } from "pinia";
import "bootstrap/dist/css/bootstrap.min.css";
// Adjust this path if the form has a specific CSS to import
// import "@educorvi/vue-json-form/dist/style.css"; 

import { formStructureProviderKey, savePathProviderKey, useFormDataStore, useFormStructureStore } from "@educorvi/vue-json-form";

const pinia = createPinia();

setup((app: App) => {
    app.use(pinia);
});

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: "^on[A-Z].*" },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
    decorators: [
        (story, context) => ({
            components: { story },
            setup() {
                const formStructureStore = useFormStructureStore();
                formStructureStore.jsonSchema = context.args.schema || {};
                formStructureStore.uiSchema = context.args.uiSchema || {};

                const fs = ref({
                    jsonElement: context.args.schema || {},
                    uiElement: context.args.uiSchema || {}
                });
                const savePath = context.args.path || context.args.savePath || '/defaultPath';

                provide(formStructureProviderKey, fs);
                provide(savePathProviderKey, savePath);

                const formDataStore = useFormDataStore();
                if (context.args.modelValue !== undefined) {
                    formDataStore.formData[savePath] = context.args.modelValue;
                }

                watch(() => context.args.schema, (newSchema) => {
                    fs.value.jsonElement = newSchema || {};
                    formStructureStore.jsonSchema = newSchema || {};
                }, { deep: true });
                watch(() => context.args.uiSchema, (newUiSchema) => {
                    fs.value.uiElement = newUiSchema || {};
                    formStructureStore.uiSchema = newUiSchema || {};
                }, { deep: true });
                watch(() => context.args.modelValue, (newVal) => {
                    formDataStore.formData[savePath] = newVal;
                });

                return {};
            },
            template: '<story />'
        }),
    ],
};

export default preview;

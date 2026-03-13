<script setup lang="ts">
import { computedLabel, injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computed, onMounted, ref, watch } from 'vue';
import { generateUISchema } from '@/Commons';
import FormWrap from '@/components/FormWrap.vue';
import type { Layout } from '@educorvi/vue-json-form-schemas';
import VerticalLayout from '@/components/LayoutElements/VerticalLayout.vue';
import { computedCssClass } from '@/computedProperties/css.ts';

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);
const cssClass = computedCssClass(layoutElement, 'vjf_object');
const label = computedLabel(layoutElement);

// const layout = ref(undefined as Layout | undefined);
//
// function setLayout() {
//     const generationOptions = {
//         scopeBase: layoutElement.value.scope,
//         layoutType: 'Group' as const,
//         groupLabel:
//             layoutElement.value.options?.label !== false
//                 ? computedLabel(layoutElement).value
//                 : '',
//         groupDescription: jsonElement.value.description,
//     };
//     const uiSchema = generateUISchema(jsonElement.value, generationOptions);
//     if (!layout.value) {
//         layout.value = uiSchema.layout;
//     } else {
//         if (JSON.stringify(layout.value) !== JSON.stringify(uiSchema.layout)) {
//             layout.value = uiSchema.layout;
//         }
//     }
// }
// TODO create formfields directly
</script>

<template>
    <template>
        <fieldset :class="cssClass">
            <legend v-show="label">
                {{ label }}
                <!--            <span style="font-size: 1rem">-->
                <!--                <component :is="HelpPopover" />-->
                <!--            </span>-->
            </legend>
            <p v-if="jsonElement.description">
                {{ jsonElement.description }}
            </p>
            <vertical-layout
                class="vjf_fieldset-content"
                :layout-element="{
                    ...subUiSchema.layout,
                    type: 'VerticalLayout',
                }"
            />
        </fieldset>
    </template>

    <style scoped lang="scss">
        legend {
            display: flex;
            align-items: center;
        }
    </style>
</template>

<style scoped></style>

<script setup lang="ts">
import type { HTMLRenderer } from '@/typings/ui-schema';
import sanitizeHtml from 'sanitize-html';
import { computed } from 'vue';

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: HTMLRenderer;
}>();

const html = computed(() => {
    return sanitizeHtml(props.layoutElement.htmlData, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat('img'),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            '*': ['style'],
        },
    });
});
</script>

<template>
    <span v-html="html" class="vjf_htmlRenderer"></span>
</template>

<style scoped></style>

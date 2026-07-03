<!--
    BasePage – Standard page wrapper with spacing + title/description header.
    Builds on BasePageContainer. In the future this will also render a
    breadcrumb navigation above the title.
-->
<script setup lang="ts">
defineProps<{
    title: string;
    description?: string;
}>();
</script>

<template>
    <BasePageContainer>
        <!-- TODO: Add breadcrumb navigation here -->
        <div class="mb-4">
            <h1 class="h3 fw-bold">{{ title }}</h1>
            <p v-if="description" class="text-secondary">
                {{ description }}
            </p>
        </div>
        <slot />
    </BasePageContainer>
</template>

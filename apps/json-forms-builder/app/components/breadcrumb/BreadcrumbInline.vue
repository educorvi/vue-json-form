<!--
    BreadcrumbInline – Inline entity path breadcrumb.

    Renders entity parent-path segments as clickable NuxtLinks
    separated by "/"

    Used inside dashboard cards and list rows where a compact
    path display is needed.
-->
<script setup lang="ts">
defineProps<{
    parentPath: Array<{ name: string; path_segment?: string }>;
}>();
</script>

<template>
    <span
        class="d-inline-flex align-items-center flex-wrap small font-monospace text-secondary"
    >
        <template v-for="(entry, idx) in parentPath" :key="idx">
            <NuxtLink
                :to="
                    Routes.groupsDetail(
                        parentPath
                            .slice(0, idx + 1)
                            .map((e) => e.path_segment ?? e.name)
                            .join('/')
                    )
                "
                class="text-secondary text-decoration-none"
            >
                {{ entry.name }}
            </NuxtLink>
            <span
                v-if="idx < parentPath.length - 1"
                class="text-secondary opacity-50 mx-1"
                >/</span
            >
        </template>
    </span>
</template>

<style scoped>
span a:hover {
    text-decoration: underline !important;
    color: var(--bs-primary) !important;
}
</style>

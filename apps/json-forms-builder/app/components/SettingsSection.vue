<!--
    SettingsSection – Simple settings section with title, description,
    and an optional actions slot for buttons (e.g. "Save").
-->
<script setup lang="ts">
defineProps<{
    title: string;
    description: string;
}>();
</script>

<template>
    <BCard class="mb-3">
        <BCardBody class="p-0">
            <div class="d-flex align-items-center px-3 py-3 gap-3">
                <div class="flex-grow-1 min-w-0">
                    <h6 class="fw-semibold mb-0">{{ title }}</h6>
                    <p
                        v-if="description"
                        class="small text-secondary mb-0 mt-1"
                    >
                        {{ description }}
                    </p>
                </div>
                <div class="flex-shrink-0">
                    <slot name="actions" />
                </div>
            </div>
            <div class="px-3 pb-3 pt-1 border-top">
                <slot />
            </div>
        </BCardBody>
    </BCard>
</template>

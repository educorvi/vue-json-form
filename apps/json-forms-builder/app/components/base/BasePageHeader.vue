<script setup lang="ts">
const { t } = useI18n();
const { trail } = useAppBreadcrumb();

// ── Breadcrumb items ────────────────────────────────────────────────────

const breadcrumbItems = computed(() => [...trail.value]);

defineProps<{
    title: string;
    description?: string;
    icon?: string;
}>();
</script>

<template>
    <!-- Breadcrumb -->
    <BreadcrumbGlobal
        v-if="trail.length > 0"
        :items="breadcrumbItems"
        class="mb-3"
    />

    <!-- Header: icon + title/description + actions -->
    <div class="d-flex flex-column flex-sm-row align-items-start mb-4 gap-2">
        <div class="d-flex align-items-center gap-3">
            <!-- Icon slot (or default icon) -->
            <slot name="icon">
                <PhosphorIcon v-if="icon" :name="icon" size="32" />
            </slot>
            <div>
                <h3 class="fw-bold mb-0">{{ title }}</h3>
                <p v-if="description" class="text-secondary mb-0 mt-1">
                    {{ description }}
                </p>
            </div>
        </div>

        <!-- Right-side actions (e.g. "New Group" button) -->
        <div
            v-if="$slots.actions"
            class="flex-shrink-0 ms-sm-auto d-flex flex-wrap gap-2"
        >
            <slot name="actions" />
        </div>
    </div>
</template>

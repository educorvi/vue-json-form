<!--
    BasePage – Standard page wrapper with spacing, breadcrumb, and
    unified title/description header.
-->
<script setup lang="ts">
import BreadcrumbGlobal from '@/components/breadcrumb/BreadcrumbGlobal.vue';

defineProps<{
    title: string;
    description?: string;
    icon?: string;
    fullHeight?: boolean;
    bodyFullWidth?: boolean;
}>();

const { t } = useI18n();
const { trail } = useAppBreadcrumb();

// ── Breadcrumb items ────────────────────────────────────────────────────

const breadcrumbItems = computed(() => [...trail.value]);
</script>

<template>
    <BasePageContainer :fullHeight="fullHeight" :full-width="bodyFullWidth">
        <!-- Breadcrumb -->
        <BreadcrumbGlobal
            v-if="trail.length > 0"
            :items="breadcrumbItems"
            class="mb-3"
        />

        <!-- Header: icon + title/description + actions -->
        <div
            class="d-flex flex-column flex-sm-row align-items-start mb-4 gap-2"
        >
            <div class="d-flex align-items-center gap-3">
                <!-- Icon slot (or default icon) -->
                <slot name="icon">
                    <PhosphorIcon v-if="icon" :name="icon" size="32" />
                </slot>
                <div>
                    <h1 class="h3 fw-bold mb-0">{{ title }}</h1>
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

        <!-- Page body -->
        <slot v-if="!bodyFullWidth" />
    </BasePageContainer>
    <slot v-if="bodyFullWidth" />
</template>

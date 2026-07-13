<!--
    BasePage – Standard page wrapper with spacing, breadcrumb, and
    unified title/description header.

    Features:
    - Breadcrumb from Pinia store (auto-populated per-page)
    - Optional icon before the title
    - Optional description
    - #actions slot for right-aligned buttons (e.g. "New Group")
-->
<script setup lang="ts">
import type { BreadcrumbItem } from '~~/app/composables/useAppBreadcrumb';

defineProps<{
    title: string;
    description?: string;
    /** Phosphor icon name to show before the title. */
    icon?: string;
    /** When true, removes padding and max-width so the page content fills the
        full available space (e.g. for full-page builders/editors). */
    fullHeight?: boolean;
}>();

const { t } = useI18n();
const { trail } = useAppBreadcrumb();

// ── Breadcrumb: always starts with a home icon ───────────────────────────

const breadcrumbItems = computed(() => {
    const items: BreadcrumbItem[] = [{ label: '', route: '/', icon: 'house' }];

    for (const entry of trail.value) {
        items.push(entry);
    }

    return items;
});
</script>

<template>
    <BasePageContainer :fullHeight="fullHeight">
        <!-- Breadcrumb -->
        <nav
            v-if="breadcrumbItems.length > 1"
            aria-label="breadcrumb"
            class="mb-3"
        >
            <ol class="breadcrumb mb-0 small">
                <li
                    v-for="(entry, idx) in breadcrumbItems"
                    :key="idx"
                    class="breadcrumb-item d-inline-flex align-items-center"
                    :class="{ active: idx === breadcrumbItems.length - 1 }"
                    :aria-current="
                        idx === breadcrumbItems.length - 1 ? 'page' : undefined
                    "
                >
                    <NuxtLink
                        v-if="entry.route && idx < breadcrumbItems.length - 1"
                        :to="entry.route"
                        class="text-decoration-none d-inline-flex align-items-center gap-1"
                        :title="
                            idx === 0 && !entry.label
                                ? t('nav.formBuilder')
                                : undefined
                        "
                    >
                        <!-- Home: icon only -->
                        <i
                            v-if="entry.icon && !entry.label"
                            class="bi bi-house-fill"
                        />
                        <PhosphorIcon
                            v-else-if="entry.icon"
                            :name="entry.icon"
                            :size="14"
                            :class="{ 'me-1': entry.label }"
                        />
                        <span v-if="entry.label">{{ entry.label }}</span>
                    </NuxtLink>
                    <span v-else class="d-inline-flex align-items-center gap-1">
                        <i
                            v-if="entry.icon && !entry.label"
                            class="bi bi-house-fill"
                        />
                        <PhosphorIcon
                            v-else-if="entry.icon"
                            :name="entry.icon"
                            :size="14"
                            :class="{ 'me-1': entry.label }"
                        />
                        {{ entry.label }}
                    </span>
                </li>
            </ol>
        </nav>

        <!-- Header: icon + title/description + actions -->
        <div
            class="d-flex flex-column flex-sm-row align-items-start mb-4 gap-2"
        >
            <div class="d-flex align-items-center gap-3">
                <PhosphorIcon
                    v-if="icon"
                    :name="icon"
                    :size="28"
                    class="flex-shrink-0 d-none d-md-flex"
                />
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
        <slot />
    </BasePageContainer>
</template>

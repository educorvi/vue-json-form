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
import { useBreadcrumbStore } from '~~/app/store/breadcrumb';
import type { BreadcrumbEntry } from '~~/app/store/breadcrumb';

defineProps<{
    title: string;
    description?: string;
    /** Phosphor icon name to show before the title. */
    icon?: string;
}>();

const { t } = useI18n();
const breadcrumbStore = useBreadcrumbStore();

// ── Breadcrumb: always starts with a home icon ───────────────────────────

const breadcrumbItems = computed(() => {
    const items: BreadcrumbEntry[] = [{ label: '', route: '/', icon: 'house' }];

    for (const entry of breadcrumbStore.trail) {
        items.push(entry);
    }

    return items;
});

function resolveLabel(entry: BreadcrumbEntry): string {
    return breadcrumbStore.resolveLabel(entry);
}
</script>

<template>
    <BasePageContainer>
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
                        class="text-decoration-none d-inline-flex align-items-center"
                        :title="
                            idx === 0 && !resolveLabel(entry)
                                ? t('nav.formBuilder')
                                : undefined
                        "
                    >
                        <!-- Home: icon only -->
                        <i
                            v-if="entry.icon && !resolveLabel(entry)"
                            class="bi bi-house-fill"
                        />
                        <PhosphorIcon
                            v-else-if="entry.icon"
                            :name="entry.icon"
                            :size="14"
                            :class="{ 'me-1': resolveLabel(entry) }"
                        />
                        <span v-if="resolveLabel(entry)">{{
                            resolveLabel(entry)
                        }}</span>
                    </NuxtLink>
                    <span v-else class="d-inline-flex align-items-center">
                        <i
                            v-if="entry.icon && !resolveLabel(entry)"
                            class="bi bi-house-fill"
                        />
                        <PhosphorIcon
                            v-else-if="entry.icon"
                            :name="entry.icon"
                            :size="14"
                            :class="{ 'me-1': resolveLabel(entry) }"
                        />
                        {{ resolveLabel(entry) }}
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

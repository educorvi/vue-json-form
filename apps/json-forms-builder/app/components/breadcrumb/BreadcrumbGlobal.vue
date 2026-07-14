<!--
    BreadcrumbGlobal – Page-level breadcrumb (nav > .breadcrumb).

    A home icon (PhosphorIcon "house") is always prepended.
    Items with a route are rendered as NuxtLinks; the last item
    (no route) is rendered as plain text (active / current page).
    Icons from BreadcrumbItem entries are shown where present.

-->
<script setup lang="ts">
import type { BreadcrumbItem } from '~~/app/composables/useAppBreadcrumb';

defineProps<{
    items: BreadcrumbItem[];
}>();

const { t } = useI18n();
</script>

<template>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-0 small">
            <!-- Home icon -->
            <li class="breadcrumb-item d-inline-flex align-items-center">
                <NuxtLink
                    to="/"
                    class="text-decoration-none d-inline-flex align-items-center gap-1"
                    :title="t('nav.formBuilder')"
                    :aria-label="t('nav.formBuilder')"
                >
                    <PhosphorIcon name="house" weight="fill" :size="14" />
                </NuxtLink>
            </li>

            <!-- Items -->
            <li
                v-for="(item, idx) in items"
                :key="idx"
                class="breadcrumb-item d-inline-flex align-items-center"
                :class="{ active: idx === items.length - 1 }"
                :aria-current="idx === items.length - 1 ? 'page' : undefined"
            >
                <NuxtLink
                    v-if="item.route && idx < items.length - 1"
                    :to="item.route"
                    class="text-decoration-none d-inline-flex align-items-center gap-1"
                >
                    <PhosphorIcon
                        v-if="item.icon"
                        :name="item.icon"
                        weight="fill"
                        :size="14"
                        :class="{
                            'me-1':
                                item.label !== undefined && item.label !== '',
                        }"
                        aria-hidden="true"
                    />
                    <template
                        v-if="item.label !== undefined && item.label !== ''"
                    >
                        {{ item.label }}
                    </template>
                </NuxtLink>
                <span v-else class="d-inline-flex align-items-center gap-1">
                    <PhosphorIcon
                        v-if="item.icon"
                        :name="item.icon"
                        weight="fill"
                        :size="14"
                        :class="{
                            'me-1':
                                item.label !== undefined && item.label !== '',
                        }"
                        aria-hidden="true"
                    />
                    <template
                        v-if="item.label !== undefined && item.label !== ''"
                    >
                        {{ item.label }}
                    </template>
                </span>
            </li>
        </ol>
    </nav>
</template>

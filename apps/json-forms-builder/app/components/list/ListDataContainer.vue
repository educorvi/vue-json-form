<script setup lang="ts" generic="T">
/**
 * Manages async data lifecycle for list views:
 * - Delayed skeleton flag (avoids flash on fast loads, configurable delay)
 * - Stale-while-revalidate (keeps old data visible during refetches)
 *
 * The parent provides the UI for each state via the scoped slot.
 * This component owns NO rendering — it only provides reactive flags.
 */
const props = withDefaults(
    defineProps<{
        items: T[];
        pending: boolean;
        error: unknown;
        skeletonDelay?: number;
    }>(),
    { skeletonDelay: 200 }
);

// --- Stale-while-revalidate ---
const displayItems = ref<T[]>([]) as Ref<T[]>;
const hasEverLoaded = ref(false);

// --- Delayed skeleton ---
const showSkeleton = ref(false);
let skeletonTimer: ReturnType<typeof setTimeout> | null = null;

watch(
    () => props.pending,
    (pending, oldPending) => {
        if (pending) {
            // Start skeleton timer — fires only if pending persists
            skeletonTimer = setTimeout(() => {
                showSkeleton.value = true;
                skeletonTimer = null;
            }, props.skeletonDelay);
        } else {
            // Fetch finished
            if (skeletonTimer) {
                clearTimeout(skeletonTimer);
                skeletonTimer = null;
            }
            showSkeleton.value = false;
            displayItems.value = props.items;

            // Only mark as "ever loaded" on a real transition from pending → idle.
            // The immediate call (oldPending === undefined) during SSR / hydration
            // must NOT set hasEverLoaded, otherwise the skeleton won't show on the
            // first client-side fetch.
            if (oldPending === true) {
                hasEverLoaded.value = true;
            }
        }
    },
    { immediate: true }
);

onUnmounted(() => {
    if (skeletonTimer) clearTimeout(skeletonTimer);
});

// --- Derived ---
const errorMessage = computed(() => {
    if (!props.error) return '';
    const e = props.error as { message?: string };
    return e.message ?? String(props.error);
});

const isEmpty = computed(
    () => !props.pending && displayItems.value.length === 0
);
</script>

<template>
    <slot
        :items="displayItems"
        :show-skeleton="showSkeleton"
        :is-empty="isEmpty"
        :error-message="errorMessage"
        :has-error="!!error"
        :pending="pending"
    />
</template>

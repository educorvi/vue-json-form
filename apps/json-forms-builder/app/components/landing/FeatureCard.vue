<script setup lang="ts">
/**
 * A single chip / badge displayed below the card description.
 * Each chip renders as a small link with an icon and label.
 */
export interface FeatureChip {
    icon: string;
    label: string;
    href: string;
}

defineProps<{
    icon: string;
    title: string;
    description: string;
    chips?: FeatureChip[];
}>();
</script>

<template>
    <BCard class="h-100 text-center">
        <BCardBody class="d-flex flex-column align-items-center">
            <div
                class="d-inline-flex align-items-center justify-content-center bg-light mb-3"
                style="width: 56px; height: 56px"
            >
                <PhosphorIcon :name="icon" :size="28" class="text-primary" />
            </div>
            <BCardTitle class="h5 mb-2">{{ title }}</BCardTitle>
            <p class="card-text text-secondary mb-3 flex-grow-1">
                {{ description }}
            </p>
            <div
                v-if="chips && chips.length"
                class="d-flex flex-wrap justify-content-center gap-2 mt-auto"
            >
                <BBadge
                    v-for="chip in chips"
                    :key="`${chip.icon}-${chip.label}`"
                    :href="chip.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="primary"
                    class="d-inline-flex align-items-center gap-1 py-1 bg-opacity-10 text-primary"
                    pill
                >
                    <PhosphorIcon :name="chip.icon" :size="12" />
                    <span class="small">{{ chip.label }}</span>
                </BBadge>
            </div>
        </BCardBody>
    </BCard>
</template>

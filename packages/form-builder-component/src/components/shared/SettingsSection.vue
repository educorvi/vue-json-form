<script setup lang="ts">
defineProps<{
    title: string;
    icon?: string;
    collapsible?: boolean;
}>();

import { ref } from 'vue';
const expanded = ref(true);
</script>

<template>
    <div class="mb-3">
        <button
            v-if="collapsible"
            class="btn btn-sm btn-link text-decoration-none text-body d-flex align-items-center gap-2 w-100 px-0 text-uppercase fw-semibold mb-2"
            style="font-size: 0.65rem; letter-spacing: 0.05em"
            @click="expanded = !expanded"
        >
            <i v-if="icon" :class="icon" />
            {{ title }}
            <i
                :class="expanded ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"
                class="ms-auto"
            />
        </button>
        <p
            v-else
            class="d-flex align-items-center gap-2 text-body fw-semibold mb-2"
            style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em"
        >
            <i v-if="icon" :class="icon" />
            {{ title }}
        </p>
        <div v-show="expanded" class="vstack gap-2">
            <slot />
        </div>
    </div>
</template>

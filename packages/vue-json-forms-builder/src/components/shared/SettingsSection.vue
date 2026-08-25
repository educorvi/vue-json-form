<script setup lang="ts">
import { ref, type Component } from 'vue';
import { BButton } from 'bootstrap-vue-next';
import { PhCaretDown, PhCaretRight } from '@phosphor-icons/vue';

defineProps<{
    title: string;
    icon?: string | Component;
    collapsible?: boolean;
}>();

const expanded = ref(true);
</script>

<template>
    <div class="mb-3">
        <b-button
            v-if="collapsible"
            variant="link"
            size="sm"
            class="text-decoration-none text-body d-flex align-items-center gap-2 w-100 px-0 text-uppercase fw-semibold mb-2"
            style="font-size: 0.65rem; letter-spacing: 0.05em"
            @click="expanded = !expanded"
        >
            <i v-if="typeof icon === 'string'" :class="icon" />
            <component v-else-if="icon" :is="icon" :size="12" weight="bold" />
            {{ title }}
            <PhCaretDown
                v-if="expanded"
                :size="12"
                weight="bold"
                class="ms-auto"
            />
            <PhCaretRight v-else :size="12" weight="bold" class="ms-auto" />
        </b-button>
        <p
            v-else
            class="d-flex align-items-center gap-2 text-body fw-semibold mb-2"
            style="
                font-size: 0.65rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            "
        >
            <i v-if="typeof icon === 'string'" :class="icon" />
            <component v-else-if="icon" :is="icon" :size="12" weight="bold" />
            {{ title }}
        </p>
        <div v-show="expanded" class="vstack gap-2">
            <slot />
        </div>
    </div>
</template>

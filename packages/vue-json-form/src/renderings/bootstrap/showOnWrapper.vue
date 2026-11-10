<script setup lang="ts">
import type {
    ShowOnWrapperProps,
    ShowOnWrapperSlots,
} from '@/renderings/PropsAndEmitsForRenderings.ts';

defineProps<ShowOnWrapperProps>();
defineSlots<ShowOnWrapperSlots>();
</script>

<template>
    <div v-if="visible" class="vjf_showOnWrapper">
        <slot />
    </div>
</template>

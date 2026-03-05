<script setup lang="ts">
import type {
    ShowOnWrapperProps,
    ShowOnWrapperSlots,
} from '@/renderings/PropsAndEmitsForRenderings.ts';

defineProps<ShowOnWrapperProps>();
defineSlots<ShowOnWrapperSlots>();
</script>

<template>
    <div class="vjf_showOnWrapper" v-if="visible">
        <slot />
    </div>
</template>

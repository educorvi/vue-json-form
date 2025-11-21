<script setup lang="ts">
import { BButtonGroup } from 'bootstrap-vue-next';
import VJFButton from '@/components/Buttons/VJFButton.vue';
import type { ButtonGroupProps } from '@/renderings/PropsAndEmitsForRenderings.ts';

defineProps<ButtonGroupProps>();
</script>

<template>
    <BButtonGroup class="w-100" :vertical="layoutElement.options?.vertical">
        <VJFButton
            v-for="button in layoutElement.buttons"
            :key="button.text"
            :layoutElement="button"
        />
    </BButtonGroup>
</template>

<style scoped></style>

<script setup lang="ts">
import type { Buttongroup } from '@educorvi/vue-json-forn-schemas';
import { BButtonGroup } from 'bootstrap-vue-next';
import VJFButton from '@/components/Buttons/VJFButton.vue';

defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Buttongroup;
}>();
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

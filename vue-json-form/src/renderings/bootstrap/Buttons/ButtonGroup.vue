<script setup lang="ts">
import type { Buttongroup } from '@/typings/ui-schema';
import { BButtonGroup } from 'bootstrap-vue-next';
import VJFButton from '@/renderings/bootstrap/Buttons/VJFButton.vue';

defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Buttongroup;
}>();
</script>

<template>
    <BButtonGroup class="w-100">
        <v-j-f-button
            v-for="button in layoutElement.buttons"
            :key="button.text"
            :layoutElement="button"
        />
    </BButtonGroup>
</template>

<style scoped></style>

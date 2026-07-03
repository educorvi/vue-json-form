<script setup lang="ts">
import { useFormStore } from '@/stores/formStore';
import CanvasElement from './CanvasElement.vue';

const store = useFormStore();
</script>

<template>
    <div class="rounded-3 overflow-hidden bg-body shadow-sm border">
        <CanvasElement :element="store.rootLayout" parent-id="" />
    </div>
</template>

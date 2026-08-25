<script setup lang="ts">
import { computed } from 'vue';
import { useFormBuilder } from '../../useFormBuilder';
import CanvasNode from './CanvasNode.vue';

const builder = useFormBuilder();

const rootUid = computed(() => builder.formDefinition.value?.root.uid ?? '');
</script>

<template>
    <div class="rounded-3 overflow-hidden bg-body shadow-sm border">
        <CanvasNode v-if="rootUid" :uid="rootUid" is-root />
    </div>
</template>

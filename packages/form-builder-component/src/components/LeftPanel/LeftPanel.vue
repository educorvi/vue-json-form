<script setup lang="ts">
import { ref, type Component } from 'vue';
import FieldPalette from './FieldPalette.vue';
import TreeViewPanel from './TreeViewPanel.vue';
import {BButton} from "bootstrap-vue-next";

const emit = defineEmits<{ toggleCollapse: [] }>();

interface Tab {
    label: string;
    icon: string;
    component: Component;
}

const tabs: Tab[] = [
    { label: 'Fields', icon: 'bi bi-grid', component: FieldPalette },
    { label: 'Tree', icon: 'bi bi-diagram-3', component: TreeViewPanel },
];

const activeIndex = ref(0);
</script>

<template>
    <div
        class="d-flex flex-column h-100 border-end bg-body"
        style="min-width: 0"
    >
        <!-- Tab Header -->
        <div class="d-flex align-items-center border-bottom flex-shrink-0 pe-1">
            <button
                v-for="(tab, i) in tabs"
                :key="tab.label"
                class="flex-grow-1 btn btn-sm rounded-0 border-0 py-2"
                :class="
                    activeIndex === i
                        ? 'border-bottom border-primary border-2 text-primary fw-medium'
                        : 'text-body'
                "
                style="border-bottom-width: 2px !important"
                @click="activeIndex = i"
            >
                <i :class="tab.icon" class="me-1" />
                {{ tab.label }}
            </button>

            <button
                class="btn btn-sm btn-link text-body flex-shrink-0 p-1"
                title="Collapse panel"
                @click="emit('toggleCollapse')"
            >
                <i class="bi bi-chevron-left" />
            </button>
        </div>

        <!-- Active tab content -->
        <div class="flex-grow-1 overflow-hidden">
            <component :is="tabs[activeIndex].component" class="h-100" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, type Component } from 'vue';
import FieldPalette from './FieldPalette.vue';
import TreeViewPanel from './TreeViewPanel.vue';
import { BButton } from 'bootstrap-vue-next';
import { PhGridFour, PhTreeStructure, PhCaretLeft } from '@phosphor-icons/vue';

const emit = defineEmits<{ toggleCollapse: [] }>();

interface Tab {
    label: string;
    icon: Component;
    component: Component;
}

const tabs: Tab[] = [
    { label: 'Fields', icon: PhGridFour, component: FieldPalette },
    { label: 'Tree', icon: PhTreeStructure, component: TreeViewPanel },
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
            <b-button
                v-for="(tab, i) in tabs"
                :key="tab.label"
                variant="link"
                size="sm"
                class="flex-grow-1 rounded-0 border-0 py-2 text-decoration-none"
                :class="
                    activeIndex === i
                        ? 'border-bottom border-primary border-2 text-primary fw-medium'
                        : 'text-body'
                "
                style="border-bottom-width: 2px !important"
                @click="activeIndex = i"
            >
                <component
                    :is="tab.icon"
                    :size="14"
                    weight="bold"
                    class="me-1"
                />
                {{ tab.label }}
            </b-button>

            <b-button
                variant="link"
                size="sm"
                class="text-body flex-shrink-0 p-1"
                title="Collapse panel"
                @click="emit('toggleCollapse')"
            >
                <PhCaretLeft :size="14" weight="bold" />
            </b-button>
        </div>

        <!-- Active tab content -->
        <div class="flex-grow-1 overflow-hidden">
            <component :is="tabs[activeIndex].component" class="h-100" />
        </div>
    </div>
</template>

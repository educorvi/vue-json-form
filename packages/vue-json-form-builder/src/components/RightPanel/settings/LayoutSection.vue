<script setup lang="ts">
import SettingsSection from '@/components/shared/SettingsSection.vue';
import { Layout } from '@educorvi/vue-json-form-builder-schemas';
import { useElementSettings } from './useElementSettings';

const { enumField } = useElementSettings();

const layout = enumField<Layout>('layout', Layout.Vertical);

/**
 * object/array (and the root form) only support vertical + horizontal —
 * the Layout enum's Group value is not offered.
 */
const layoutOptions: Layout[] = [Layout.Vertical, Layout.Horizontal];
</script>

<template>
    <SettingsSection
        title="Layout"
        icon="bi bi-layout-three-columns"
        :collapsible="true"
    >
        <div class="btn-group btn-group-sm w-100" role="group">
            <button
                v-for="opt in layoutOptions"
                :key="opt"
                type="button"
                class="btn"
                :class="
                    layout === opt ? 'btn-primary' : 'btn-outline-secondary'
                "
                @click="layout = opt"
            >
                {{ opt === Layout.Vertical ? 'Vertical' : 'Horizontal' }}
            </button>
        </div>
    </SettingsSection>
</template>

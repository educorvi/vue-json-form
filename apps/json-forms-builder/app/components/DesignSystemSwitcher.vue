<script setup lang="ts">
/**
 * DesignSystemSwitcher — opens a modal dialog where the user can switch
 * between the UV Corporate design system and PrimeVue Aura.
 *
 * Persists the selection in localStorage under the key "designSystem" and
 * re-applies on mount. // TODO. use pinia
 */
import { ref, onMounted } from 'vue';
import { usePrimeVue } from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import { UVNexusPreset } from '@educorvi/uv-theme';

const { t } = useI18n();
const primevue = usePrimeVue();

type DesignSystem = 'uv' | 'aura';

const active = ref<DesignSystem>('uv');
const dialogVisible = ref(false);

const options: {
    id: DesignSystem;
    labelKey: string;
    descKey: string;
    icon: string;
    preset: object;
}[] = [
    {
        id: 'uv',
        labelKey: 'designSystem.uv.label',
        descKey: 'designSystem.uv.description',
        icon: 'pi pi-building',
        preset: UVNexusPreset,
    },
    {
        id: 'aura',
        labelKey: 'designSystem.aura.label',
        descKey: 'designSystem.aura.description',
        icon: 'pi pi-palette',
        preset: Aura,
    },
];

function applyDesignSystem(id: DesignSystem, preset: object) {
    active.value = id;
    localStorage.setItem('designSystem', id);
    primevue.config.theme = {
        ...(primevue.config.theme as object),
        preset,
    };
    dialogVisible.value = false;
}

// TODO: use pinia
onMounted(() => {
    const saved = (localStorage.getItem('designSystem') ??
        'uv') as DesignSystem;
    if (saved !== 'uv') {
        const option = options.find((o) => o.id === saved);
        if (option) applyDesignSystem(option.id, option.preset);
    } else {
        active.value = 'uv';
    }
});
</script>

<template>
    <Button
        :label="t('designSystem.label')"
        icon="pi pi-palette"
        variant="text"
        severity="secondary"
        fluid
        class="justify-start"
        @click="dialogVisible = true"
    />

    <!-- Modal dialog-->
    <Dialog
        v-model:visible="dialogVisible"
        modal
        :header="t('designSystem.label')"
        :style="{ width: '36rem' }"
    >
        <div class="flex flex-col gap-3 pt-1">
            <div
                v-for="option in options"
                :key="option.id"
                class="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors"
                :class="
                    active === option.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                        : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 hover:bg-surface-50 dark:hover:bg-surface-800'
                "
                @click="applyDesignSystem(option.id, option.preset)"
            >
                <i
                    :class="[
                        option.icon,
                        'text-2xl mt-0.5 shrink-0',
                        active === option.id
                            ? 'text-primary-500'
                            : 'text-surface-400',
                    ]"
                />
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-sm">{{
                            t(option.labelKey)
                        }}</span>
                        <Tag
                            v-if="active === option.id"
                            :value="t('designSystem.active')"
                            severity="primary"
                        />
                    </div>
                    <p
                        class="text-xs text-surface-500 dark:text-surface-400 mt-0.5 leading-snug"
                    >
                        {{ t(option.descKey) }}
                    </p>
                </div>
            </div>
        </div>

        <p class="text-xs text-surface-400 dark:text-surface-500 mt-4">
            <i class="pi pi-info-circle mr-1" />
            {{ t('designSystem.hint') }}
        </p>
    </Dialog>
</template>

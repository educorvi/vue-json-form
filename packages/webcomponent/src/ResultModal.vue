<script setup lang="ts">
import { ref } from 'vue';
import type { StageStatus } from '@/types.ts';
import type { SseEvent, SummaryStage } from '@/vueComponentCommons.ts';
import VueMarkdown from 'vue-markdown-render';
import { BCard, BProgress, BCollapse, BModal } from 'bootstrap-vue-next';
//@ts-ignore
import IBiClock from '~icons/bi/clock';
//@ts-ignore
import IBiHourGlassSplit from '~icons/bi/hourglass-split';
//@ts-ignore
import IBiCheckLg from '~icons/bi/check-lg';
//@ts-ignore
import IBiX from '~icons/bi/x';

type StageState = {
    status: StageStatus;
    progress?: number;
};

const UI_STRINGS = {
    PREPROCESSING: 'Vorverarbeitung',
    PAGE_COUNTING: 'Zählen der Seiten',
    IMAGE_CONVERSION: 'Bildkonvertierung',
    MARKDOWN_CONVERSION: 'Markdown-Konvertierung',
    GENERATING: 'Generieren',
};

const summary = ref<string | null>(null);
const showModal = ref(false);

const initialState: Record<SummaryStage, StageState> = {
    PREPROCESSING: {
        status: 'WAITING',
    },
    PAGE_COUNTING: {
        status: 'WAITING',
    },
    IMAGE_CONVERSION: {
        status: 'WAITING',
    },
    MARKDOWN_CONVERSION: {
        status: 'WAITING',
    },
    GENERATING: {
        status: 'WAITING',
    },
};

const stages = ref<Record<SummaryStage, StageState>>(initialState);

function updateStage(event: SseEvent) {
    showModal.value = true;
    if (summary.value) {
        // reset modal if old summary is present
        summary.value = null;
        for (let stage in stages.value) {
            stages.value[stage as SummaryStage].status = 'WAITING';
            stages.value[stage as SummaryStage].progress = undefined;
        }
    }
    if (event.event === 'progress') {
        const ed = event.data;
        stages.value[ed.stage].status = ed.status;
        if (ed.current && ed.total) {
            stages.value[ed.stage].progress = (ed.current / ed.total) * 100;
        }
        if (ed.status === 'DONE' || ed.status === 'ERROR') {
            stages.value[ed.stage].progress = 100;
        }
    } else if (event.event === 'result') {
        summary.value = event.data.summary;
    }
}

defineExpose({ updateStage });
</script>

<template>
    <b-modal
        v-model="showModal"
        ok-only
        :ok-disabled="!summary"
        :no-header-close="!summary"
        :no-close-on-backdrop="!summary"
        :no-close-on-esc="!summary"
        ok-title="Schließen"
        ok-class="w-100"
        ok-variant="outline-primary"
        title="Zusammenfassung"
        centered
        size="lg"
    >
        <b-collapse :show="!summary">
            <b-card v-for="(stage, key) in stages" :key="key" class="mb-2">
                <div class="card-content">
                    <IBiClock
                        v-if="stage.status === 'WAITING'"
                        style="color: var(--bs-warning)"
                    />
                    <IBiHourGlassSplit
                        v-if="stage.status === 'PROCESSING'"
                        style="color: var(--bs-info)"
                    />
                    <IBiCheckLg
                        v-if="stage.status === 'DONE'"
                        style="color: var(--bs-success)"
                    />
                    <IBiX
                        v-if="stage.status === 'ERROR'"
                        style="color: var(--bs-danger)"
                    />
                    <span class="ms-2">{{ UI_STRINGS[key] }}</span>
                </div>
                <b-progress
                    class="stage-progress"
                    :max="100"
                    :value="stage.progress ?? 0"
                    :variant="
                        stage.status === 'ERROR'
                            ? 'danger'
                            : stage.status === 'DONE'
                              ? 'success'
                              : 'primary'
                    "
                />
            </b-card>
        </b-collapse>
        <b-collapse :show="!!summary">
            <vue-markdown v-if="summary" :source="summary" />
        </b-collapse>
    </b-modal>
</template>

<style scoped>
.card-content {
    display: flex;
    align-items: center;
}
.stage-progress {
    height: 5px;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
}
</style>

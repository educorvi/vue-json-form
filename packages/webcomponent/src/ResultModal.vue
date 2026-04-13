<script setup lang="ts">
import { ref } from 'vue';
import { type SseEvent, type StageStatus, SummaryStage } from '@/types.ts';
import VueMarkdown from 'vue-markdown-render';
import {
    BCard,
    BProgress,
    BCollapse,
    BModal,
    BFormInput,
    BButton,
    BAlert,
    BButtonGroup,
} from 'bootstrap-vue-next';
//@ts-ignore
import IBiClock from '~icons/bi/clock';
//@ts-ignore
import IBiHourGlassSplit from '~icons/bi/hourglass-split';
//@ts-ignore
import IBiCheckLg from '~icons/bi/check-lg';
//@ts-ignore
import IBiX from '~icons/bi/x';
import {
    AutoLanguageProvider,
    isNotNullOrUndefined,
} from '@educorvi/vue-json-form';
import axios from 'axios';

const intl = new AutoLanguageProvider();

type StageState = {
    status: StageStatus;
    progress?: number;
    animated?: boolean;
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
const showSaveModal = ref(false);
const saveTitle = ref('');
const saveUrl = ref<string | undefined>(undefined);
const saveError = ref<string | null>(null);
const clipboard = ref<boolean>(false);
const feedbackUrl = ref<string | null>(null);

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
        if (
            isNotNullOrUndefined(ed.current) &&
            isNotNullOrUndefined(ed.total)
        ) {
            stages.value[ed.stage].progress = (ed.current / ed.total) * 100;
            stages.value[ed.stage].animated = false;
        } else if (ed.status === 'PROCESSING') {
            stages.value[ed.stage].progress = 100;
            stages.value[ed.stage].animated = true;
        }

        if (ed.status === 'DONE' || ed.status === 'ERROR') {
            stages.value[ed.stage].progress = 100;
            stages.value[ed.stage].animated = false;
        }
    } else if (event.event === 'result') {
        summary.value = event.data.summary;
    } else if (event.event === 'error') {
        summary.value = intl.getString('errors.generic.temporaryError');
    }
}

function setSaveUrl(url: string | undefined) {
    saveUrl.value = url;
}

function savePage() {
    if (saveUrl.value) {
        axios
            .post(
                saveUrl.value,
                {
                    summary: summary.value,
                    title: saveTitle.value,
                },
                {
                    withCredentials: true,
                    headers: { Accept: 'application/json' },
                }
            )
            .then((res) => {
                showSaveModal.value = false;
                const redirectUrl = res.data?.redirectUrl;
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                }
            })
            .catch((error) => {
                console.error('Error saving summary:', error);
                saveError.value = intl.getString(
                    'errors.generic.temporaryError'
                );
            });
    }
}

function setClipboard(value: boolean) {
    clipboard.value = value;
}

function setFeedbackUrl(url: string | undefined) {
    if (url) {
        feedbackUrl.value = url;
    }
}

function writeToClipboard() {
    if (summary.value) {
        navigator.clipboard.writeText(summary.value);
    }
}

function openFeedback() {
    if (feedbackUrl.value) {
        window.open(feedbackUrl.value, '_blank')?.focus();
    }
}

defineExpose({ updateStage, setSaveUrl, setFeedbackUrl, setClipboard });
</script>

<template>
    <b-modal
        v-model="showModal"
        :no-header-close="!summary"
        :no-close-on-backdrop="!summary"
        :no-close-on-esc="!summary"
        :title="intl.getString('modals.summary.title')"
        scrollable
        centered
        size="xl"
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
                    :animated="stage.animated ?? false"
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
        <!--
               :ok-disabled="!summary"
               :cancel-disabled="!summary"
               :ok-class="!saveUrl ? 'removed-button' : ''"
               :ok-title="intl.getString('buttons.save')"
               ok-variant="outline-primary"
               cancel-variant="primary"
               :cancel-title="intl.getString('buttons.close')"
               -->
        <template #footer>
            <BButtonGroup class="w-100">
                <BButton
                    v-if="saveUrl"
                    :disabled="!summary"
                    variant="outline-primary"
                    @click="
                        showModal = false;
                        showSaveModal = true;
                    "
                    >{{ intl.getString('buttons.save') }}</BButton
                >
                <BButton
                    v-if="clipboard"
                    :disabled="!summary"
                    variant="outline-primary"
                    @click="writeToClipboard"
                    >{{ intl.getString('buttons.clipboard') }}</BButton
                >
                <BButton
                    v-if="feedbackUrl"
                    :disabled="!summary"
                    variant="outline-primary"
                    @click="openFeedback"
                    >{{ intl.getString('buttons.feedback') }}</BButton
                >
                <!--                <BButton>{{ intl.getString('buttons.close') }}</BButton>-->
            </BButtonGroup>
        </template>
    </b-modal>
    <b-modal
        v-model="showSaveModal"
        no-footer
        centered
        :title="intl.getString('modals.summary.saveTitle')"
    >
        <label for="saveTitle" class="form-label">{{
            intl.getString('modals.summary.saveInstruction')
        }}</label>
        <b-form-input id="saveTitle" v-model="saveTitle" class="mb-3" />

        <b-alert :model-value="!!saveError" variant="danger">
            {{ saveError }}
        </b-alert>

        <b-button variant="primary" @click="savePage" class="w-100"
            >Save</b-button
        >
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

<style>
.removed-button {
    display: none;
}
</style>

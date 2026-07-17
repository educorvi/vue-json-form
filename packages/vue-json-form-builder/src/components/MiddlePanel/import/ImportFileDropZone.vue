<script setup lang="ts">
import { ref } from 'vue';
import { BButton } from 'bootstrap-vue-next';
import { PhFile, PhFileArrowUp, PhFolderOpen, PhX } from '@phosphor-icons/vue';

const props = defineProps<{
    file: File | null;
    label: string;
    inputId: string;
    error: string | null;
}>();

const emit = defineEmits<{
    'update:file': [file: File | null];
    'update:error': [error: string | null];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

function onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    emit('update:file', file);
    emit('update:error', null);
}

function onDrop(event: DragEvent) {
    const file = event.dataTransfer?.files[0] ?? null;
    emit('update:file', file);
    emit('update:error', null);
}

function clear() {
    emit('update:file', null);
    emit('update:error', null);
    if (fileInputRef.value) fileInputRef.value.value = '';
}

function triggerBrowse() {
    fileInputRef.value?.click();
}
</script>

<template>
    <div class="d-flex flex-column gap-2">
        <label class="form-label fw-medium small">{{ label }}</label>

        <div
            class="border border-2 rounded p-4 d-flex flex-column align-items-center gap-2 text-center"
            :class="
                error
                    ? 'border-danger bg-danger bg-opacity-10'
                    : file
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-secondary'
            "
            style="border-style: dashed !important"
            @dragover.prevent
            @drop.prevent="onDrop"
        >
            <PhFile v-if="file" :size="32" weight="bold" class="text-primary" />
            <PhFileArrowUp
                v-else
                :size="32"
                weight="bold"
                class="text-body-secondary"
            />

            <div>
                <p class="mb-0 small fw-medium text-body-secondary">
                    {{ file ? file.name : 'Drop file or click to browse' }}
                </p>
                <p class="mb-0 text-body-secondary" style="font-size: 0.7rem">
                    {{
                        file
                            ? `${(file.size / 1024).toFixed(1)} KB`
                            : '.json files only'
                    }}
                </p>
            </div>

            <div class="d-flex gap-2">
                <input
                    :id="inputId"
                    ref="fileInputRef"
                    type="file"
                    accept=".json,application/json"
                    class="d-none"
                    @change="onFileChange"
                />
                <BButton
                    size="sm"
                    variant="outline-secondary"
                    @click="triggerBrowse"
                >
                    <PhFolderOpen :size="14" weight="bold" class="me-1" />
                    {{ file ? 'Replace' : 'Browse' }}
                </BButton>
                <BButton
                    v-if="file"
                    size="sm"
                    variant="outline-danger"
                    @click="clear"
                >
                    <PhX :size="14" weight="bold" class="me-1" />
                    Remove
                </BButton>
            </div>
        </div>

        <div v-if="error" class="text-danger text-xs">{{ error }}</div>
    </div>
</template>

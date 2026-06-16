<script setup lang="ts">
import { ref } from 'vue';

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
</script>

<template>
    <div class="d-flex flex-column gap-2">
        <label class="form-label fw-medium small">{{ label }}</label>

        <div
            class="border border-2 border-dashed rounded p-4 d-flex flex-column align-items-center gap-2 text-center"
            :class="
                error
                    ? 'border-danger bg-danger bg-opacity-10'
                    : file
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-secondary'
            "
            @dragover.prevent
            @drop.prevent="onDrop"
        >
            <i
                class="d-block"
                :class="
                    file
                        ? 'bi bi-file-earmark-check text-primary'
                        : 'bi bi-file-earmark-arrow-up text-body'
                "
                style="font-size: 2rem"
            />

            <div>
                <p class="mb-0 small fw-medium">
                    {{ file ? file.name : 'Drop file or click to browse' }}
                </p>
                <p class="mb-0 text-body" style="font-size: 0.7rem">
                    {{
                        file
                            ? `${(file.size / 1024).toFixed(1)} KB`
                            : '.json files only'
                    }}
                </p>
            </div>

            <div class="d-flex gap-2">
                <label
                    class="btn btn-sm btn-outline-secondary mb-0"
                    style="cursor: pointer"
                >
                    {{ file ? 'Replace' : 'Browse' }}
                    <input
                        :id="inputId"
                        ref="fileInputRef"
                        type="file"
                        accept=".json,application/json"
                        class="d-none"
                        @change="onFileChange"
                    />
                </label>
                <button
                    v-if="file"
                    class="btn btn-sm btn-outline-danger"
                    @click="clear"
                >
                    Remove
                </button>
            </div>
        </div>

        <div v-if="error" class="text-danger text-xs">{{ error }}</div>
    </div>
</template>

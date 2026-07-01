<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'bootstrap-vue-next';

const props = defineProps<{
    code: string;
    label: string;
    filename: string;
}>();

const { show: showToast } = useToast();

function copyToClipboard() {
    navigator.clipboard.writeText(props.code).then(() => {
        showToast?.({
            props: {
                title: 'Copied!',
                body: `${props.label} copied to clipboard`,
                variant: 'success',
                pos: 'top-end',
                interval: 2000,
            },
        });
    });
}

function download() {
    const blob = new Blob([props.code], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = props.filename;
    a.click();
    URL.revokeObjectURL(url);
}
</script>

<template>
    <div>
        <div class="d-flex gap-2 mb-2">
            <button
                class="btn btn-sm btn-outline-secondary"
                @click="copyToClipboard"
            >
                <i class="bi bi-clipboard me-1" />Copy
            </button>
            <button
                class="btn btn-sm btn-outline-secondary"
                @click="download"
            >
                <i class="bi bi-download me-1" />Download
            </button>
        </div>
        <pre class="code-block">{{ code }}</pre>
    </div>
</template>

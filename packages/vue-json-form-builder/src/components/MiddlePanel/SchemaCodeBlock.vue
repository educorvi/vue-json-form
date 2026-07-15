<script setup lang="ts">
import { ref } from 'vue';
import { BButton } from 'bootstrap-vue-next';
import { PhClipboard, PhDownload } from '@phosphor-icons/vue';
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
            <BButton
                size="sm"
                variant="outline-secondary"
                @click="copyToClipboard"
            >
                <PhClipboard :size="14" weight="bold" class="me-1" />Copy
            </BButton>
            <BButton size="sm" variant="outline-secondary" @click="download">
                <PhDownload :size="14" weight="bold" class="me-1" />Download
            </BButton>
        </div>
        <pre class="code-block">{{ code }}</pre>
    </div>
</template>

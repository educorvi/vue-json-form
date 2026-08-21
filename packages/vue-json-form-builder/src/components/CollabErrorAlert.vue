<script setup lang="ts">
import { computed } from 'vue';
import { BAlert } from 'bootstrap-vue-next';
import type { CollabErrorReason } from '../useFormBuilder';

const props = defineProps<{ reason: CollabErrorReason }>();

const messages: Record<CollabErrorReason, string> = {
    unauthorized:
        'The collaboration connection was rejected — please sign in again and retry.',
    'form-not-found': 'The form does not exist (or has not been saved yet).',
    forbidden:
        'You do not have edit access to this form. Ask an owner to grant you editor or owner access.',
    'permission-denied':
        'The collaboration connection was rejected by the server.',
    unreachable:
        'The collaboration server is not reachable. Check that it is running and that the WebSocket URL is correct, then reload the page.',
    unknown: 'The collaboration connection was rejected by the server.',
};

const message = computed(() => messages[props.reason]);
</script>

<template>
    <div
        class="vjfb-auth d-flex align-items-center justify-content-center"
        style="min-height: 300px"
    >
        <div class="text-center" style="max-width: 32rem">
            <BAlert show variant="danger">
                {{ message }}
            </BAlert>
        </div>
    </div>
</template>

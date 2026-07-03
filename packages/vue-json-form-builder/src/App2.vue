<script setup lang="ts">
import { useFormStore } from './stores/formStore';

// const store = useFormStore();
</script>

<template>
    <BApp>
        <div class="d-flex flex-column vh-100 overflow-hidden">
            <!-- App Header -->
            <div
                class="app-header d-flex align-items-center px-3 gap-2 bg-dark shadow-sm"
                data-bs-theme="dark"
            >
                <i class="bi bi-pencil-square text-primary" />
                <span class="text-white fw-semibold small"
                    >JSON Forms Generator</span
                >
                >
            </div>
        </div>
    </BApp>
</template>

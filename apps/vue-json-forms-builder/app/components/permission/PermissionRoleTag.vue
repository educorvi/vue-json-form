<!--
    PermissionRoleTag – Displays a role as a BootstrapVue badge with a tooltip
    that explains what the role allows.
-->
<script setup lang="ts">
const props = defineProps<{
    role: string;
}>();

const { t } = useI18n();

const roleLabel = computed(() => t(`permissions.roles.${props.role}`));
const roleDescription = computed(() =>
    t(`permissions.roles.${props.role}Description`)
);

const bgClass = computed(() => {
    switch (props.role) {
        case 'owner':
            return 'bg-danger';
        case 'editor':
            return 'bg-warning text-dark';
        default:
            return 'bg-secondary';
    }
});
</script>

<template>
    <span v-b-tooltip="roleDescription" style="cursor: help">
        <span class="badge rounded-pill" :class="bgClass">
            {{ roleLabel }}
        </span>
    </span>
</template>

<template>
    <div class="flex flex-col items-center p-4 min-w-[200px]">
        <div class="flex items-center gap-3 mb-2">
            <img
                v-if="user?.avatar"
                :src="user.avatar"
                alt="Avatar"
                class="w-10 h-10 rounded-full border"
            />
            <div>
                <div class="font-semibold text-base">
                    {{ user?.name || 'User' }}
                </div>
                <div class="text-xs text-surface-500">{{ user?.email }}</div>
            </div>
        </div>
        <Button
            label="Sign out"
            icon="logout"
            size="small"
            severity="secondary"
            outlined
            @click="$emit('logout')"
            class="w-full mt-2"
        />
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    user: { name?: string; email?: string; avatar?: string };
}>();
</script>

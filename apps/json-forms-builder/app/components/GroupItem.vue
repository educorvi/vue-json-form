<script setup lang="ts">
/**
 * GroupItem — renders a single group row in the expandable tree.
 * Can be expanded to load and display its children.
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

const GroupItem = defineAsyncComponent(() => import('./GroupItem.vue'));

const props = defineProps<{
    group: {
        id: number;
        title?: string;
        name?: string;
        description?: string | null;
        member_count: number;
        group_count: number;
        form_count: number;
    };
    /** nesting depth for indentation */
    depth?: number;
}>();

const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;
const { t } = useI18n();

const expanded = ref(false);
const childPage = ref(1);
const childPageSize = 10;

// No `await` — keeps this a synchronous component so SSR doesn't suspend on it.
// `immediate: false` means no fetch until the user expands the row.
const { data: children, pending } = useAsyncData(
    `group-children-${props.group.id}`,
    () =>
        orpc.groups.listChildren({
            params: { id: String(props.group.id) },
            query: { page: childPage.value, page_size: childPageSize },
        }),
    { watch: [childPage], immediate: false }
);

function toggleExpand() {
    expanded.value = !expanded.value;
    if (expanded.value && !children.value) {
        refreshNuxtData(`group-children-${props.group.id}`);
    }
}

const indentStyle = computed(() => ({
    paddingLeft: `${(props.depth ?? 0) * 1.5}rem`,
}));

const displayName = computed(
    () => props.group.title || props.group.name || `Group #${props.group.id}`
);
</script>

<template>
    <div>
        <!-- Row -->
        <div
            class="flex items-center gap-2 py-2 px-3 rounded hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer select-none"
            :style="indentStyle"
            @click="toggleExpand"
        >
            <Button
                :icon="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                text
                rounded
                size="small"
                class="flex-shrink-0"
                :loading="pending"
                @click.stop="toggleExpand"
            />
            <i class="pi pi-folder text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
                <NuxtLink
                    :to="`/groups/${group.id}`"
                    class="font-medium text-surface-800 dark:text-surface-100 hover:underline"
                    @click.stop
                >
                    {{ displayName }}
                </NuxtLink>
                <span
                    v-if="group.description"
                    class="text-xs text-surface-400 ml-2 truncate"
                >
                    {{ group.description }}
                </span>
            </div>
            <div
                class="flex items-center gap-3 text-xs text-surface-400 flex-shrink-0"
            >
                <span v-if="group.group_count"
                    ><i class="pi pi-folder mr-1" />{{
                        group.group_count
                    }}</span
                >
                <span v-if="group.form_count"
                    ><i class="pi pi-file mr-1" />{{ group.form_count }}</span
                >
                <span
                    ><i class="pi pi-users mr-1" />{{
                        group.member_count
                    }}</span
                >
            </div>
        </div>

        <!-- Children (lazy) -->
        <template v-if="expanded">
            <div
                v-if="pending"
                class="flex items-center gap-2 px-4 py-2 text-sm text-surface-400"
            >
                <i class="pi pi-spin pi-spinner" />
                {{ t('common.loading') }}
            </div>
            <template v-else-if="children && children.data.length">
                <GroupItem
                    v-for="child in children.data"
                    :key="child.id"
                    :group="child as any"
                    :depth="(depth ?? 0) + 1"
                />
                <!-- Child pagination -->
                <div
                    v-if="children.total_pages > 1"
                    class="flex items-center justify-end gap-2 px-4 py-1"
                    :style="{ paddingLeft: `${((depth ?? 0) + 2) * 1.5}rem` }"
                >
                    <Button
                        icon="pi pi-chevron-left"
                        text
                        rounded
                        size="small"
                        :disabled="childPage <= 1"
                        @click="childPage--"
                    />
                    <span class="text-xs text-surface-400">
                        {{ childPage }} / {{ children.total_pages }}
                    </span>
                    <Button
                        icon="pi pi-chevron-right"
                        text
                        rounded
                        size="small"
                        :disabled="childPage >= children.total_pages"
                        @click="childPage++"
                    />
                </div>
            </template>
            <div
                v-else
                class="px-4 py-2 text-xs text-surface-400"
                :style="{ paddingLeft: `${((depth ?? 0) + 2) * 1.5}rem` }"
            >
                {{ t('groups.noSubGroups') }}
            </div>
        </template>
    </div>
</template>

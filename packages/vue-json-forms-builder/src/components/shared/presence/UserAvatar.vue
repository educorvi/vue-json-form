<script setup lang="ts">
/**
 * UserAvatar.vue — circular avatar showing a user's initials on their
 * assigned color. Rendered with bootstrap-vue-next's BAvatar.
 * Hover shows the user name as a tooltip (CSS tooltip via data-name,
 * so it works even inside overflow containers).
 *
 * The avatar color is passed as the `--user-avatar-bg` CSS custom
 * property; the global rule `.b-avatar.user-avatar-custom-color` applies
 * it with `!important` — BAvatar's default `text-bg-secondary` class
 * (from its default `variant="secondary"`) also uses `!important` and
 * would otherwise override any inline background color.
 *
 * An optional presence dot (green online / gray offline) sits on the
 * bottom-right edge of the avatar.
 */
import { computed } from 'vue';
import { BAvatar } from 'bootstrap-vue-next';
import {
    OWN_USER_COLOR,
    type CollabUser,
} from '@educorvi/vue-json-forms-builder-schemas/collab';
import { initialsOf } from './initials';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
    defineProps<{
        user: CollabUser;
        /** 'xs' = settings fields, 'sm' = canvas/tree, 'md' = toolbar */
        size?: 'xs' | 'sm' | 'md';
        /** tooltip text (defaults to the user name) */
        title?: string;
        /** id of the local user — rendered in the reserved primary color */
        selfId?: string;
        /** presence dot: 'online' (green) | 'offline' (gray) | undefined (none) */
        status?: 'online' | 'offline';
    }>(),
    {
        size: 'sm',
        title: undefined,
        selfId: undefined,
        status: undefined,
    }
);

const initials = computed(() => initialsOf(props.user.name));

const displayColor = computed(() =>
    props.user.id === props.selfId && props.user.color !== OWN_USER_COLOR
        ? OWN_USER_COLOR
        : props.user.color
);

/** BAvatar accepts a number for size → px. */
const px = computed(() => ({ xs: 16, sm: 20, md: 26 })[props.size]);
</script>

<template>
    <span
        class="user-avatar position-relative d-inline-flex"
        :data-name="title ?? user.name"
        :aria-label="user.name"
    >
        <!-- attrs (class/style from the stack) land on the inner BAvatar so
             the wrapper stays transform-free — the status dot can then paint
             above neighbouring avatars (z-index in the root context). -->
        <BAvatar
            v-bind="$attrs"
            class="user-avatar-custom-color text-white fw-semibold user-select-none flex-shrink-0"
            :text="initials"
            :size="px"
            :style="[
                {
                    '--user-avatar-bg': displayColor,
                    backgroundColor: displayColor,
                },
                $attrs.style,
            ]"
        />
        <span
            v-if="status"
            class="status-dot"
            :class="status === 'online' ? 'status-online' : 'status-offline'"
            :title="status === 'online' ? 'Online' : 'Offline'"
        />
    </span>
</template>

<style scoped>
.user-avatar {
    border-radius: 50%;
    line-height: 1;
}

/* ring around the avatar (matches the old border on the BAvatar root) */
.user-avatar :deep(.b-avatar) {
    border: 1.5px solid var(--bs-body-bg, #fff);
}

/* presence dot — sits on the bottom-right edge of the avatar */
.status-dot {
    position: absolute;
    right: -1px;
    bottom: -1px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 1.5px solid var(--bs-body-bg, #fff);
    /* dots paint above neighbouring (later) avatars in a stack */
    z-index: 1;
    pointer-events: none;
}
.status-online {
    background-color: #198754; /* bootstrap success */
}
.status-offline {
    background-color: #adb5bd; /* bootstrap secondary */
}

/* CSS tooltip — instant, works in overflow containers, no JS needed. */
.user-avatar:hover::after {
    content: attr(data-name);
    position: absolute;
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    max-width: 240px;
    background-color: #212529;
    color: #fff;
    font-size: 0.75rem;
    line-height: 1.2;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    white-space: normal;
    text-align: center;
    z-index: 1080;
    pointer-events: none;
}
</style>

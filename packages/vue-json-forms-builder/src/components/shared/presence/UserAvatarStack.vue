<script setup lang="ts">
/**
 * UserAvatarStack.vue — the presence stack in the toolbar.
 *
 * Layout: [overlapping group of other users (first N)] [+N pill] [self]
 * The other users overlap using bootstrap-vue-next's BAvatarGroup (it
 * injects negative margins into the child BAvatars, so the group must
 * contain bare BAvatar elements). The local user is always rendered
 * separately on the right — never overlapped — with a green/gray
 * presence dot (only self is tracked as online/offline for now).
 */
import { computed } from 'vue';
import { BAvatar, BAvatarGroup } from 'bootstrap-vue-next';
import type { CollabUser } from '@educorvi/vue-json-forms-builder-schemas/collab';
import UserAvatar from './UserAvatar.vue';
import { initialsOf } from './initials';

const props = withDefaults(
    defineProps<{
        /** everyone we know about — the entry matching `selfId` is shown
         *  separately on the right, the rest overlap on the left */
        users: Array<CollabUser & { online?: boolean }>;
        size?: 'xs' | 'sm' | 'md';
        /** max OTHER avatars before collapsing into "+N" */
        max?: number;
        /** id of the local user — rendered in the reserved primary color */
        selfId?: string;
    }>(),
    {
        size: 'sm',
        max: 3,
    }
);

/** everyone except the local user */
const others = computed(() => props.users.filter((u) => u.id !== props.selfId));
/** the local user, null while not connected */
const self = computed(
    () => props.users.find((u) => u.id === props.selfId) ?? null
);
/** first `max` other users — the rest collapse into "+N" */
const visibleOthers = computed(() => others.value.slice(0, props.max));
const overflow = computed(() => Math.max(0, others.value.length - props.max));

/** avatar diameter per size — used for the "+N" pill so it matches */
const px = computed(() => ({ xs: 16, sm: 20, md: 26 })[props.size]);

/** BAvatarGroup overlap factor (0..1); internally divided by 2 per side */
const overlap = 0.3;
const overlapScale = overlap / 2;

/** tuck the "+N" pill under the last group avatar (group padding + 6px) */
const pillShift = computed(() => -(px.value * overlapScale + 6));

const selfStatus = computed<'online' | 'offline' | undefined>(() =>
    self.value && self.value.online !== undefined
        ? self.value.online
            ? 'online'
            : 'offline'
        : undefined
);

const moreLabel = computed(
    () => `${overflow.value} more user${overflow.value === 1 ? '' : 's'}`
);
</script>

<template>
    <span class="user-avatar-stack d-inline-flex align-items-center">
        <!-- other users: overlapping group (BAvatarGroup injects the
             negative margins into the bare BAvatar children) -->
        <BAvatarGroup
            v-if="visibleOthers.length > 0"
            class="stacked-group"
            :size="px"
            :overlap="overlap"
        >
            <BAvatar
                v-for="user in visibleOthers"
                :key="user.id"
                class="user-avatar-custom-color"
                :text="initialsOf(user.name)"
                :title="user.name"
                :style="{ '--user-avatar-bg': user.color }"
            />
        </BAvatarGroup>

        <!-- collapsed remainder of the other users -->
        <span
            v-if="overflow > 0"
            class="stacked-more d-inline-flex align-items-center justify-content-center rounded-circle text-body-secondary bg-body-tertiary fw-semibold user-select-none flex-shrink-0"
            :data-name="moreLabel"
            :style="{
                width: `${px}px`,
                height: `${px}px`,
                fontSize: `${Math.round(px * 0.5)}px`,
                marginLeft:
                    visibleOthers.length > 0 ? `${pillShift}px` : undefined,
            }"
        >
            +{{ overflow }}
        </span>

        <!-- the local user — always shown, separate from the overlap -->
        <UserAvatar
            v-if="self"
            :user="self"
            :size="size"
            :self-id="selfId"
            :status="selfStatus"
            class="stacked-self ms-1"
        />
    </span>
</template>

<style scoped>
/* the "+N" pill needs its own positioning context for the tooltip and
   must paint above the avatars' status dots (same z-index, later in DOM) */
.stacked-more {
    position: relative;
    z-index: 1;
}

/* tooltip for the "+N" pill (avatars have their own tooltip in UserAvatar) */
.stacked-more:hover::after {
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

<script setup lang="ts">
/**
 * OnlineState.vue — realtime collaboration presence indicator.
 *
 * Shows the known users (self included) as an overlapping avatar stack:
 * all other users on the left, the local user rightmost. Only the local
 * user carries a green (online) / gray (offline) presence dot — other
 * users are not tracked as online/offline yet.
 *
 * Clicking opens the dropdown: the local user first (header, with an
 * "Online"/"Offline" status line), then an "Other users" label, then
 * all other users — each row shows the name only.
 *
 * Uses BDropdown (floating-ui) instead of a hand-rolled popover: the menu
 * is positioned with `strategy="fixed"` + `boundary="viewport"`, so it is
 * truly elevated and never causes scrollbars / layout shifts in the
 * surrounding toolbar.
 */
import { computed } from 'vue';
import { PhCaretDown } from '@phosphor-icons/vue';
import { BDropdown, BDropdownHeader, BDropdownItem } from 'bootstrap-vue-next';
import { useFormBuilder } from '../../useFormBuilder';
import UserAvatarStack from '@/components/shared/presence/UserAvatarStack.vue';
import UserAvatar from '@/components/shared/presence/UserAvatar.vue';

const builder = useFormBuilder();

/** everyone we know about (self included), one entry per user id */
const knownUsers = computed(() => builder.knownUsers.value);
const selfId = computed(() => builder.currentUser.value?.id);

/** the local user (header row), null while not connected */
const self = computed(
    () => knownUsers.value.find((u) => u.id === selfId.value) ?? null
);
/** everyone except the local user */
const others = computed(() =>
    knownUsers.value.filter((u) => u.id !== selfId.value)
);

/** stack order: all others to the left, self rightmost */
const orderedUsers = computed(() =>
    self.value ? [...others.value, self.value] : others.value
);

/** tooltip on the trigger: who is in the form right now */
const userNamesTitle = computed(() =>
    knownUsers.value.map((u) => u.name).join(', ')
);
</script>

<template>
    <BDropdown
        class="online-state"
        variant="link"
        size="sm"
        no-caret
        :disabled="knownUsers.length === 0"
        :title="userNamesTitle || 'No users yet'"
        aria-label="Online users"
        boundary="viewport"
        strategy="fixed"
    >
        <template #button-content>
            <UserAvatarStack
                :users="orderedUsers"
                size="sm"
                :max="3"
                :self-id="selfId"
            />
            <!-- small chevron hinting the menu opens on click -->
            <PhCaretDown
                :size="12"
                weight="bold"
                class="text-body-secondary flex-shrink-0 ms-1"
                aria-hidden="true"
            />
        </template>

        <template v-if="self">
            <!-- BDropdownHeader puts the class on the outer <li>; the flex
                 layout must be on a wrapper inside the <h6> -->
            <BDropdownHeader class="online-state-self">
                <span class="d-flex align-items-center gap-2">
                    <UserAvatar :user="self" size="sm" :self-id="selfId" />
                    <span>
                        <span class="d-block small">
                            {{ self.name }}
                            <span class="text-body-secondary">(you)</span>
                        </span>
                        <span class="presence-line">
                            <span
                                class="presence-dot"
                                :class="
                                    self.online
                                        ? 'presence-online'
                                        : 'presence-offline'
                                "
                            />
                            <span
                                class="small"
                                :class="
                                    self.online
                                        ? 'text-success'
                                        : 'text-body-secondary'
                                "
                            >
                                {{ self.online ? 'Online' : 'Offline' }}
                            </span>
                        </span>
                    </span>
                </span>
            </BDropdownHeader>
            <!-- label separating the local user from everyone else -->
            <BDropdownHeader
                v-if="others.length > 0"
                class="online-state-others-label"
            >
                Other users
            </BDropdownHeader>
        </template>
        <BDropdownItem
            v-for="user in others"
            :key="user.id"
            disabled
            class="online-state-user"
        >
            <!-- BDropdownItem puts the class on the outer <li>; the flex
                 layout must be on a wrapper inside the <button> -->
            <span class="d-flex align-items-center gap-2">
                <UserAvatar :user="user" size="sm" :self-id="selfId" />
                <span class="d-block small">{{ user.name }}</span>
            </span>
        </BDropdownItem>
    </BDropdown>
</template>

<style scoped>
.online-state :deep(.dropdown-header) {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
    text-transform: none;
}

/* display-only rows — keep them readable instead of dimmed */
.online-state :deep(.dropdown-item.disabled) {
    opacity: 1;
}

/* "Other users" label between the local user and the rest */
.online-state :deep(.online-state-others-label .dropdown-header) {
    color: var(--bs-secondary-color, #6c757d);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* "Online"/"Offline" line under a user name in the dropdown */
.presence-line {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}
.presence-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
}
.presence-online {
    background-color: #198754; /* bootstrap success */
}
.presence-offline {
    background-color: #adb5bd; /* bootstrap secondary */
}
</style>

<script setup lang="ts">
// import { PhNotePencil, PhUser } from '@phosphor-icons/vue';

const { t } = useI18n();
const { user } = useUserSession();

const navItems = computed(() => [
    {
        label: t('nav.forms'),
        icon: 'ph ph-file-text',
        route: '/forms',
    },
    { label: t('nav.groups'), icon: 'ph ph-tree-structure', route: '/groups' },
    { label: t('nav.users'), icon: 'ph ph-users', route: '/users' },
]);

const userName = computed(() => (user as { name?: string })?.name ?? 'User');
</script>

<template>
    <BNavbar
        toggleable="md"
        variant="light"
        class="border-bottom bg-body px-3 py-2"
    >
        <BNavbarBrand href="/dashboard" class="d-flex align-items-center gap-2">
            <!-- <PhNotePencil :size="20" class="text-primary" /> -->
            <PhosphorIcon name="note-pencil" class="text-primary" />
            <span class="fw-semibold small"> {{ t('nav.formBuilder') }}</span>
        </BNavbarBrand>
        <BNavbarToggle target="nav-collapse" />
        <BCollapse id="nav-collapse" is-nav>
            <BNavbarNav>
                <BNavItem v-for="item in navItems" :href="item.route">
                    <i :class="item.icon"></i> {{ item.label }}
                </BNavItem>
            </BNavbarNav>
            <BNavbarNav class="ms-auto mb-2 mb-lg-0">
                <BNavItemDropdown right no-caret :auto-close="false">
                    <template #button-content>
                        <span class="d-flex align-items-center gap-2">
                            <!-- <PhUser :size="18" /> -->
                            <PhosphorIcon name="user" />
                            <span class="fw-medium">{{ userName }}</span>
                        </span>
                    </template>
                    <UserProfileDropdown />
                </BNavItemDropdown>
            </BNavbarNav>
        </BCollapse>
    </BNavbar>
</template>

<script setup lang="ts">
import { APP_LINKS } from '@/utils/links';

const { t } = useI18n();
</script>

<template>
    <BNavbar
        toggleable="md"
        variant="light"
        class="border-bottom bg-body px-3 py-2"
    >
        <!-- Brand -->
        <BNavbarBrand href="/" class="d-flex align-items-center gap-2 mb-0">
            <PhosphorIcon name="note-pencil" class="text-primary" />
            <span class="fw-semibold small">Form Builder</span>
        </BNavbarBrand>

        <BNavbarToggle target="landing-nav-collapse" />

        <BCollapse id="landing-nav-collapse" is-nav>
            <!-- Left-side nav links -->
            <BNavbarNav>
                <BNavItem
                    :href="APP_LINKS.demo"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <PhosphorIcon name="play" class="me-1" />
                    {{ t('landing.nav.demo') }}
                </BNavItem>
                <BNavItem
                    v-if="APP_LINKS.docs"
                    :href="APP_LINKS.docs"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <PhosphorIcon name="book-open-text" class="me-1" />
                    {{ t('landing.nav.docs') }}
                </BNavItem>
                <BNavItem v-else disabled>
                    <PhosphorIcon name="book-open-text" class="me-1" />
                    {{ t('landing.nav.docs') }}
                </BNavItem>
            </BNavbarNav>

            <!-- Right-side: GitHub + theme + locale -->
            <BNavbarNav class="ms-auto mb-2 mb-lg-0">
                <BNavItem
                    :href="APP_LINKS.github"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="d-flex align-items-center"
                >
                    <PhosphorIcon name="github-logo" class="me-1" />
                    GitHub
                </BNavItem>
                <div class="d-flex align-items-center gap-2 px-2">
                    <LocaleSwitcher />
                    <ThemeSwitcher />
                </div>
            </BNavbarNav>
        </BCollapse>
    </BNavbar>
</template>

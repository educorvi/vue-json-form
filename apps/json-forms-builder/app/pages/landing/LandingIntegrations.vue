<!--
    LandingIntegrations – Showcases the different ways to integrate the form
    renderer: as a generic Web Component, a Vue component, or a Flutter widget.
-->
<script setup lang="ts">
import type { FeatureChip } from '@/components/FeatureCard.vue';
import { APP_LINKS } from '@/utils/links';

const { t } = useI18n();

/** Internal chip definition with a translation key for the label. */
interface ChipDef {
    icon: string;
    label: string;
    href: string;
    /** If true, treat label as a translation key and pass through t() */
    translate?: boolean;
}

interface IntegrationDef {
    icon: string;
    titleKey: string;
    descKey: string;
    chips?: ChipDef[];
}

const integrationDefs: IntegrationDef[] = [
    {
        icon: 'globe',
        titleKey: 'landing.integrations.web.title',
        descKey: 'landing.integrations.web.description',
        chips: [
            {
                icon: 'github-logo',
                label: 'chips.github',
                href: APP_LINKS.webcomponentRepo,
                translate: true,
            },
        ],
    },
    {
        icon: 'file-vue',
        titleKey: 'landing.integrations.vue.title',
        descKey: 'landing.integrations.vue.description',
        chips: [
            {
                icon: 'play',
                label: 'chips.demo',
                href: APP_LINKS.vueJsonFormDemo,
                translate: true,
            },
            {
                icon: 'github-logo',
                label: 'chips.github',
                href: APP_LINKS.vueJsonFormRepo,
                translate: true,
            },
        ],
    },
    {
        icon: 'device-mobile',
        titleKey: 'landing.integrations.flutter.title',
        descKey: 'landing.integrations.flutter.description',
        chips: [
            {
                icon: 'play',
                label: 'chips.demo',
                href: APP_LINKS.flutterDemo,
                translate: true,
            },
            {
                icon: 'github-logo',
                label: 'chips.github',
                href: APP_LINKS.flutterRepo,
                translate: true,
            },
        ],
    },
];

function resolveChips(chips?: ChipDef[]): FeatureChip[] | undefined {
    if (!chips || chips.length === 0) return undefined;
    return chips.map((c) => ({
        icon: c.icon,
        label: c.translate ? t(c.label) : c.label,
        href: c.href,
    }));
}

const integrations = computed(() =>
    integrationDefs.map((i) => ({
        icon: i.icon,
        title: t(i.titleKey),
        description: t(i.descKey),
        chips: resolveChips(i.chips),
    }))
);
</script>

<template>
    <section class="px-4 py-5 bg-body-tertiary">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="display-5 fw-bold mb-2">
                    {{ t('landing.integrations.heading') }}
                </h2>
                <p class="text-secondary fs-5">
                    {{ t('landing.integrations.subheading') }}
                </p>
            </div>
            <div class="row row-cols-1 row-cols-md-3 g-4">
                <div
                    v-for="integration in integrations"
                    :key="integration.title"
                    class="col"
                >
                    <FeatureCard
                        :icon="integration.icon"
                        :title="integration.title"
                        :description="integration.description"
                        :chips="integration.chips"
                    />
                </div>
            </div>
        </div>
    </section>
</template>

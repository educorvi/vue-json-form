<script setup lang="ts">
import type { FeatureChip } from '@/components/landing/FeatureCard.vue';
import { APP_LINKS } from '@/utils/links';

const { t } = useI18n();

interface ChipDef {
    icon: string;
    label: string;
    href: string;
    translate?: boolean;
}

interface FeatureDef {
    icon: string;
    titleKey: string;
    descKey: string;
    chips?: ChipDef[];
}

const featureDefs: FeatureDef[] = [
    {
        icon: 'note-pencil',
        titleKey: 'features.formBuilder.title',
        descKey: 'features.formBuilder.description',
        chips: [
            {
                icon: 'play',
                label: 'chips.demo',
                href: APP_LINKS.visualFormBuilder,
                translate: true,
            },
            {
                icon: 'github-logo',
                label: 'chips.github',
                href: APP_LINKS.visualFormBuilderRepo,
                translate: true,
            },
        ],
    },
    {
        icon: 'users',
        titleKey: 'features.userManagement.title',
        descKey: 'features.userManagement.description',
    },
    {
        icon: 'code',
        titleKey: 'features.openApi.title',
        descKey: 'features.openApi.description',
        chips: [
            { icon: 'link', label: 'Swagger', href: APP_LINKS.swagger },
            { icon: 'link', label: 'Scalar', href: APP_LINKS.scalar },
        ],
    },
    {
        icon: 'file-code',
        titleKey: 'features.jsonUiSchema.title',
        descKey: 'features.jsonUiSchema.description',
        chips: [
            {
                icon: 'book-open-text',
                label: 'JSON Forms',
                href: APP_LINKS.jsonForms,
            },
            {
                icon: 'book-open-text',
                label: 'UI Schema',
                href: APP_LINKS.uiSchemaDocs,
                translate: true,
            },
        ],
    },
    {
        icon: 'clock-counter-clockwise',
        titleKey: 'features.versioning.title',
        descKey: 'features.versioning.description',
    },
    {
        icon: 'lock',
        titleKey: 'features.sso.title',
        descKey: 'features.sso.description',
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

const features = computed(() =>
    featureDefs.map((f) => ({
        icon: f.icon,
        title: t(f.titleKey),
        description: t(f.descKey),
        chips: resolveChips(f.chips),
    }))
);
</script>

<template>
    <section class="px-4 py-5 bg-body">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="display-5 fw-bold mb-2">
                    {{ t('landing.featuresHeading') }}
                </h2>
                <p class="text-secondary fs-5">
                    {{ t('landing.featuresSubheading') }}
                </p>
            </div>
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                <div
                    v-for="feature in features"
                    :key="feature.title"
                    class="col"
                >
                    <FeatureCard
                        :icon="feature.icon"
                        :title="feature.title"
                        :description="feature.description"
                        :chips="feature.chips"
                    />
                </div>
            </div>
        </div>
    </section>
</template>

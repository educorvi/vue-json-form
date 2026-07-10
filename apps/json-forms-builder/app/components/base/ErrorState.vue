<!--
    ErrorState – Reusable error display for 404 (not found) and 500 (error) states.
    Shows a centered card with icon, title, description, and a call-to-action button.
-->
<script setup lang="ts">
defineProps<{
    /** Phosphor icon name shown above the title. */
    icon?: string;
    /** Heading text. */
    title: string;
    /** Description / body text. */
    description: string;
    /** Route for the CTA button. Omit to hide the button. */
    actionRoute?: string;
    /** Label for the CTA button. */
    actionLabel?: string;
}>();
</script>

<template>
    <BasePageContainer>
        <BCard>
            <BCardBody class="text-center py-5">
                <PhosphorIcon
                    v-if="icon"
                    :name="icon"
                    :size="48"
                    class="text-secondary mb-3"
                />
                <h2 class="h4 fw-bold">{{ title }}</h2>
                <p
                    class="text-secondary mb-0"
                    style="max-width: 28rem; margin: 0 auto"
                >
                    {{ description }}
                </p>
                <BButton
                    v-if="actionRoute"
                    :to="actionRoute"
                    variant="primary"
                    class="mt-4"
                >
                    {{ actionLabel }}
                </BButton>
            </BCardBody>
        </BCard>
    </BasePageContainer>
</template>

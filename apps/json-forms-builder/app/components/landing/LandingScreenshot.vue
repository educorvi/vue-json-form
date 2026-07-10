<!--
    LandingScreenshot – Placeholder section for a screenshot of the form builder.
    Replace the placeholder div with an <img> when ready.
-->
<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
    <section class="px-4 py-5 bg-body-tertiary">
        <div class="container">
            <div class="text-center mb-4">
                <h2 class="display-5 fw-bold mb-2">
                    {{ t('landing.screenshotHeading') }}
                </h2>
            </div>
            <!-- TODO: Replace with an actual screenshot image -->
            <div
                class="border"
                
            >
                <img
                    src="~/assets/img/form-builder-demo.png"
                    alt="Form Builder Screenshot"
                    class="img-fluid"
            </div>
        </div>
    </section>
</template>

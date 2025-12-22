<script setup lang="ts">
import { watch } from 'vue';
import type {
    WizardProgessProps,
    WizardProgressEmits,
} from '@/renderings/PropsAndEmitsForRenderings.ts';

const props = defineProps<WizardProgessProps>();
const emit = defineEmits<WizardProgressEmits>();

function clickedStep(step: number) {
    const index = step - 1;
    if (index < props.currentStep) {
        emit('update:currentStep', index);
    }
}

/**
 * Watches the `currentStep` property and updates the progress bar
 * based on the current step value.
 * This function dynamically calculates the progress percentage and
 * applies it to the CSS custom property `--progress` for visual updates.
 */
watch(
    () => props.currentStep,
    () => {
        // Select all elements with the class `.wrappers-parent`
        const wrappers =
            document.querySelectorAll<HTMLElement>('.wrappers-parent');

        // Iterate over each wrapper element
        wrappers.forEach((wrapper) => {
            const bar = wrapper.querySelector<HTMLElement>(
                '.custom-wizard-progress'
            );
            const steps = wrapper.querySelectorAll<HTMLElement>(
                '.stepWrapper .stepNumber'
            );

            if (!bar || steps.length < 2) return;
            // Get the first and last step elements
            const first = steps[0];
            const last = steps[steps.length - 1];
            if (!first || !last) return;

            // Calculate the center positions of the first and last steps
            const firstCenter = first.offsetLeft + first.offsetWidth / 2;
            const lastCenter = last.offsetLeft + last.offsetWidth / 2;

            // Calculate the usable width between the first and last step centers
            const usableWidth = lastCenter - firstCenter;

            // Calculate the progress ratio (0 to 1) based on the current step
            const t = props.currentStep / (steps.length - 1);

            // Calculate the progress in pixels
            const progressPx = firstCenter + t * usableWidth;

            // Convert the progress to a percentage of the progress bar's width
            const progressPercent = (progressPx / bar.offsetWidth) * 100;

            // Update the CSS custom property `--progress` with the calculated percentage
            bar.style.setProperty('--progress', `${progressPercent}%`);
        });
    },
    { immediate: true }
);
</script>
<template>
    <div class="wrappers-parent">
        <div class="stepWrapper">
            <div class="d-flex justify-content-between">
                <div
                    :class="{
                        'stepNumber d-flex justify-content-center align-items-center': true,
                        active: stepNumber - 1 === currentStep,
                        filled: stepNumber - 1 < currentStep,
                    }"
                    v-for="stepNumber in Array.from(
                        { length: props.numberOfPages },
                        (_, i) => i + 1
                    )"
                >
                    <button
                        :disabled="stepNumber > currentStep"
                        class="fs-4"
                        @click="() => clickedStep(stepNumber)"
                    >
                        {{ stepNumber }}
                    </button>
                </div>
            </div>
            <!--        <BProgress class="stepProgress" :value="currentStep" :max="max - 1" />-->
        </div>
        <div class="custom-wizard-progress"></div>
        <div class="stepWrapperBg">
            <div class="d-flex justify-content-between">
                <div
                    :class="{
                        'stepNumber d-flex justify-content-center align-items-center': true,
                        active: stepNumber - 1 === currentStep,
                        filled: stepNumber - 1 < currentStep,
                    }"
                    v-for="stepNumber in Array.from(
                        { length: props.numberOfPages },
                        (_, i) => i + 1
                    )"
                ></div>
            </div>
            <!--        <BProgress class="stepProgress" :value="currentStep" :max="max - 1" />-->
        </div>
    </div>
</template>

<style scoped lang="scss">
$step-border-radius: 50%;
$step-size: 40px;
$bar-size: 13px;

.wrappers-parent {
    position: relative;
    margin-left: 40px;
    margin-right: 40px;
}
.stepWrapper {
    position: relative;
    z-index: 5;
    //visibility: hidden;
}

.custom-wizard-progress {
    --progress: 0%;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--bs-primary);
    mix-blend-mode: lighten;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: var(--progress);
        width: calc(100% - var(--progress));
        height: 100%;
        background: var(--bs-secondary-bg);
        transition: all 0.4s ease-in-out;
    }
}

.stepWrapperBg {
    background: var(--bs-body-bg);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;

    & .stepNumber {
        background: black;
        border: none;
    }

    &::before {
        content: '';
        position: absolute;
        top: 50%;
        width: 100%;
        border-radius: 8px;
        height: $bar-size;
        background: black;
        transform: translateY(-50%);
    }
}
.stepProgress {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    transform: translateY(-50%);
    z-index: -2;
}

@property --fadePercent {
    syntax: '<length-percentage>';
    initial-value: 100%;
    inherits: false;
}

.stepNumber {
    text-align: center;
    background: var(--bs-body-bg);
    position: relative;
    width: $step-size;
    height: $step-size;
    border-radius: $step-border-radius;
    border: 4px solid transparent;
    background-clip: content-box;

    & > button {
        background: transparent;
        border: none !important;

        &[disabled] {
            color: unset;
        }
    }
}
</style>

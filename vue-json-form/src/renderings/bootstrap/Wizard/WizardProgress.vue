<script setup lang="ts">
import { BProgress, BRow, BCol } from 'bootstrap-vue-next';
import { watch } from 'vue';
const props = defineProps<{
    max: number;
    pageNames?: string[];
}>();
const currentStep = defineModel<number>('currentStep', { required: true });

function clickedStep(step: number) {
    const index = step - 1;
    if (index < currentStep.value) {
        currentStep.value = index;
    }
}
watch(currentStep, () => {
    Array.from(
        document.querySelectorAll<HTMLTableElement>('.custom-wizard-progress')
    ).forEach((el: HTMLElement) => {
        const progress = (currentStep.value / (props.max - 1)) * 100;
        el.style.setProperty('--progress', `${progress}%`);
        el.style.setProperty('--offset', `${progress / 100}%`);
    });
});
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
                        { length: props.max },
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
                        { length: props.max },
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
    --offset: 0%;
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
        left: calc(var(--progress) + (var(--offset)));
        width: calc(100% - var(--progress) - (var(--offset)));
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
        left: calc($step-size/2);
        width: calc(100% - $step-size);
        height: $bar-size;
        background: black;
        transform: translateY(-50%);
        padding-left: calc($step-size/2);
        padding-right: calc($step-size/2);
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

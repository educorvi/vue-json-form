<script setup lang="ts">
import { BProgress, BRow, BCol } from 'bootstrap-vue-next';
const props = defineProps<{
    max: number;
    pageNames: string[];
}>();
const currentStep = defineModel<number>('currentStep', { required: true });

function clickedStep(step: number) {
    const index = step - 1;
    if (index < currentStep.value) {
        currentStep.value = index;
    }
}
</script>

<template>
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
                <button class="fs-1" @click="() => clickedStep(stepNumber)">
                    {{ stepNumber }}
                </button>
            </div>
        </div>
        <BProgress class="stepProgress" :value="currentStep" :max="max - 1" />
    </div>
    <div class="d-flex justify-content-between">
        <div
            style="flex: 1 1 0"
            class="text-center"
            v-for="(pageName, index) in pageNames"
            :key="index"
        >
            <span class="fs-4">
                {{ pageName }}
            </span>
        </div>
    </div>
</template>

<style scoped lang="scss">
$step-border-radius: 50%;
.stepWrapper {
    position: relative;
    margin-left: 40px;
    margin-right: 40px;
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
    width: 60px;
    height: 60px;
    border-radius: $step-border-radius;

    &::after {
        content: '';
        position: absolute;
        height: calc(100% + 10px);
        width: calc(100% + 10px);
        //background: gray;
        background-image: linear-gradient(
            to left,
            var(--bs-secondary-bg) var(--fadePercent),
            var(--bs-primary)
        );
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: -1;
        border-radius: $step-border-radius;
        transition: --fadePercent 0.1s;
        transition-delay: 0s;
    }

    &.active::after {
        --fadePercent: 40%;
        transition-delay: 0.3s !important;
        transition: --fadePercent 0.5s;
    }
    &.filled::after {
        --fadePercent: -1000%;
        transition-delay: 0s;
        transition: --fadePercent 0.5s;
    }

    & > button {
        background: transparent;
        border: none !important;
    }
}
</style>

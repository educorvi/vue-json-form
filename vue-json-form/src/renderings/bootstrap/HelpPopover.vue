<script setup lang="ts">
import { BBadge, BPopover } from 'bootstrap-vue-next';
import { injectJsonData } from '@/computedProperties/json.ts';
const { layoutElement } = injectJsonData();
</script>

<template>
    <BPopover v-if="layoutElement.options?.help?.text">
        <template #target>
            <BBadge
                pill
                :variant="layoutElement.options.help.variant ?? 'primary'"
                >{{ layoutElement.options.help.label ?? 'i' }}</BBadge
            ></template
        >
        <!--                    <template #title>Popover Title</template>-->
        {{ layoutElement.options.help.text }}
    </BPopover>
</template>

<style lang="scss">
@import 'bootstrap/scss/functions';
@import 'bootstrap/scss/variables';
.vjf_group > legend > span {
    padding-left: $spacer * 0.25;
}
</style>

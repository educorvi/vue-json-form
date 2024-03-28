import { computed, ref, type Ref } from 'vue';
import { isDependentElement, isLegacyShowOn } from '@/typings/typeValidators';
import type { LayoutElement, ShowOnFunctionType } from '@/typings/ui-schema';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { Parser, UndefinedPathError, UsageError } from '@educorvi/rita';
import { computedAsync } from '@vueuse/core';

function getComparisonFunction(functionName: ShowOnFunctionType) {
    switch (functionName) {
        case 'EQUALS':
            return (a: any, b: any) => {
                if (a === undefined) a = false;
                return a == b;
            };
        case 'NOT_EQUALS':
            return (a: any, b: any) => {
                if (a === undefined) a = false;
                return a != b;
            };
        case 'GREATER':
            return (a: any, b: any) => a > b;
        case 'GREATER_OR_EQUAL':
            return (a: any, b: any) => a >= b;
        case 'SMALLER':
            return (a: any, b: any) => a < b;
        case 'SMALLER_OR_EQUAL':
            return (a: any, b: any) => a < b;
        case 'LONGER':
            return (a: any, b: any) => (a || '').length > b;
    }
}

export function computedShowOnLogic(layoutElement: LayoutElement): Ref<boolean> {
    const { formData } = storeToRefs(useFormDataStore());
    if (!isDependentElement(layoutElement)) {
        return ref(true);
    }
    if (isLegacyShowOn(layoutElement.showOn)) {
        return computed(() => {
            const compFunc = getComparisonFunction(layoutElement.showOn.type);
            const value = layoutElement.showOn.referenceValue;
            return compFunc(formData.value[layoutElement.showOn.scope], value);
        });
    }
    let show = ref(false);
    const parser = new Parser();
    const rule = parser.parseRule(layoutElement.showOn);

    useFormDataStore().$subscribe((_, state) => {
        try {
            rule.evaluate(state.formData).then((result) => {
                show.value = result;
            });
        } catch (e) {
            show.value = false;
        }
    });
    return show;

    // return computedAsync(async () => {
    //     if (isLegacyShowOn(layoutElement.showOn)) {
    //         const compFunc = getComparisonFunction(layoutElement.showOn.type);
    //         const value = layoutElement.showOn.referenceValue;
    //         return compFunc(formData.value[layoutElement.showOn.scope], value);
    //     } else {
    //         const parser = new Parser();
    //         const rule = parser.parseRule(layoutElement.showOn);
    //         const ruleResult = rule.evaluate(formData.value);
    //         console.log(await ruleResult);
    //         return await ruleResult;
    //     }
    // }, false);
}

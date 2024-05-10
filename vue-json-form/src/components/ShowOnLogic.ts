import { computed, ref, type Ref } from 'vue';
import { isDependentElement, isLegacyShowOn } from '@/typings/typeValidators';
import type { LayoutElement, ShowOnFunctionType } from '@/typings/ui-schema';
import { storeToRefs } from 'pinia';
import { Parser, UndefinedPathError } from '@educorvi/rita';
import type { dependentElement } from '@/typings/customTypes';
import { useFormStore } from '@/stores/formStore';

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

function checkDependentElement(
    dependentElement: dependentElement
): Ref<boolean> {
    const { formData } = storeToRefs(useFormStore());
    if (isLegacyShowOn(dependentElement.showOn)) {
        return computed(() => {
            if (!isLegacyShowOn(dependentElement.showOn)) {
                throw new Error('This should not happen');
            }
            const compFunc = getComparisonFunction(
                dependentElement.showOn.type
            );
            const value = dependentElement.showOn.referenceValue;
            return compFunc(
                formData.value[dependentElement.showOn.scope],
                value
            );
        });
    } else {
        const show = ref(false);
        const parser = new Parser();
        const rule = parser.parseRule(dependentElement.showOn);
        const formDataStore = useFormStore();
        formDataStore.$subscribe(() => {
            rule.evaluate(formDataStore.cleanedFormData)
                .then((result) => {
                    show.value = result;
                })
                .catch((e) => {
                    show.value = false;
                    if (!(e instanceof UndefinedPathError)) {
                        console.warn('Error while evaluating showOn rule:', e);
                    }
                });
        });
        return show;
    }
}

export function computedShowOnLogic(
    layoutElement: LayoutElement
): Ref<boolean> {
    if (!isDependentElement(layoutElement)) {
        return ref(true);
    } else {
        return checkDependentElement(layoutElement);
    }
}

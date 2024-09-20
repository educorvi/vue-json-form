import { computed, ref, type Ref } from 'vue';
import { isDependentElement, isLegacyShowOn } from '@/typings/typeValidators';
import type {
    DescendantControlOverrides,
    LayoutElement,
    ShowOnFunctionType,
} from '@/typings/ui-schema';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { Atom, Parser, RitaError, UndefinedPathError } from '@educorvi/rita';
import type { dependentElement } from '@/typings/customTypes';
import { mergeDescendantControlOptionsOverrides } from '@/components/ProviderKeys';

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
    const formDataStore = useFormDataStore();
    if (isLegacyShowOn(dependentElement.showOn)) {
        return computed(() => {
            if (!isLegacyShowOn(dependentElement.showOn)) {
                throw new Error('This should not happen');
            }
            const compFunc = getComparisonFunction(
                dependentElement.showOn.type
            );
            const value = dependentElement.showOn.referenceValue;
            try {
                return compFunc(
                    Atom.getPropertyByString(
                        formDataStore.cleanedFormData.json,
                        dependentElement.showOn.path
                    ),
                    value
                );
            } catch (e) {
                if (e instanceof UndefinedPathError) {
                    console.warn(
                        `Error while evaluating showOn rule: ${e.message}`,
                        dependentElement.showOn
                    );
                }
                return false;
            }
        });
    } else {
        const show = ref(false);
        const parser = new Parser();
        const rule = parser.parseRule(dependentElement.showOn);
        formDataStore.$subscribe(() => {
            rule.evaluate(formDataStore.cleanedFormData.json)
                .then((result) => {
                    show.value = result;
                })
                .catch((e) => {
                    show.value = false;
                    if (e instanceof RitaError) {
                        console.warn(
                            `Error while evaluating showOn rule "${rule.id}": ${e.message}\nIn formula:`,
                            e.context
                        );
                    }
                });
        });
        return show;
    }
}

export function computedShowOnLogic(
    layoutElement: LayoutElement
): Ref<boolean> {
    let localLayoutElement = layoutElement;
    if (layoutElement.type === 'Control') {
        localLayoutElement =
            mergeDescendantControlOptionsOverrides(layoutElement);
    }

    if (!isDependentElement(localLayoutElement)) {
        return ref(true);
    } else {
        return checkDependentElement(localLayoutElement);
    }
}

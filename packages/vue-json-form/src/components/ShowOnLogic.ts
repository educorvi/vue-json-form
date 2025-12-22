import { computed, ref, type Ref } from 'vue';
import { isDependentElement, isLegacyShowOn } from '@/typings/typeValidators';
import type {
    DescendantControlOverrides,
    LayoutElement,
    LegacyShowOnProperty,
    ShowOnFunctionType,
} from '@educorvi/vue-json-form-schemas';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import {
    Atom,
    HasNoLengthError,
    Parser,
    RitaError,
    UndefinedPathError,
} from '@educorvi/rita';
import type { DependentElement } from '@/typings/customTypes';
import { mergeDescendantControlOptionsOverrides } from '@/components/ProviderKeys';
import { VJF_ARRAY_ITEM_PREFIX } from '@/Commons';
import { cleanScope } from '@/computedProperties/json';

function getComparisonFunction<T>(functionName: ShowOnFunctionType) {
    switch (functionName) {
        case 'EQUALS':
            return (a: T, b: T) => {
                return a == b;
            };
        case 'NOT_EQUALS':
            return (a: T, b: T) => {
                return a != b;
            };
        case 'GREATER':
            return (a: T, b: T) => a > b;
        case 'GREATER_OR_EQUAL':
            return (a: T, b: T) => a >= b;
        case 'SMALLER':
            return (a: T, b: T) => a < b;
        case 'SMALLER_OR_EQUAL':
            return (a: T, b: T) => a < b;
    }
}

export const arrayAliasRegex = new RegExp(
    `^([^.\\s]+)\\.(${VJF_ARRAY_ITEM_PREFIX}[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})`
);

export function getArrayItemIndices(dependentElement: LayoutElement) {
    const formDataStore = useFormDataStore();
    const arrayItemIndices: Record<string, number> = {};

    if (dependentElement.type === 'Control') {
        const scopeParts = dependentElement.scope.split('/');

        const arrayAliases = scopeParts.map((e, i) => {
            const results = e.match(arrayAliasRegex);
            if (results) {
                return {
                    arrayName:
                        scopeParts.slice(0, i).join('/') + '/' + results[1],
                    arrayAlias: results[2],
                };
            }
            return null;
        });
        arrayAliases.forEach((alias) => {
            if (alias) {
                const cleanedName = cleanScope(alias.arrayName);
                arrayItemIndices[cleanedName] =
                    formDataStore.arrayAliasIndices.get(
                        alias.arrayAlias || ''
                    ) ?? 0;
            }
        });
    }
    return arrayItemIndices;
}

function checkDependentElement(
    dependentElement: DependentElement
): Ref<boolean> {
    const formDataStore = useFormDataStore();
    if (isLegacyShowOn(dependentElement.showOn)) {
        return computed(() => {
            if (!isLegacyShowOn(dependentElement.showOn)) {
                throw new Error('This should not happen');
            }
            const compFunc = getComparisonFunction<
                Awaited<ReturnType<Atom['getPropertyByString']>>
            >(dependentElement.showOn.type);
            const value = dependentElement.showOn.referenceValue;
            try {
                return compFunc(
                    Atom.getPropertyByString(
                        formDataStore.cleanedFormData.json,
                        dependentElement.showOn.path,
                        ''
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
        let rule;
        try {
            rule = parser.parseRule(dependentElement.showOn);
        } catch (e) {
            console.warn(
                `Error while parsing showOn rule '${dependentElement.showOn?.id}'`,
                e
            );
            return show;
        }
        formDataStore.$subscribe(() => {
            const arrayItemIndices = getArrayItemIndices(dependentElement);
            // if (Object.keys(arrayItemIndices).length > 0) {
            //     console.log(arrayItemIndices);
            // }
            const evalData = {
                $selfIndices: arrayItemIndices,
                ...formDataStore.cleanedFormData.json,
            };
            // console.log(evalData);
            rule.evaluate(evalData)
                .then((result) => {
                    show.value = result;
                })
                .catch((e) => {
                    show.value = false;
                    if (e instanceof HasNoLengthError) {
                        console.warn(
                            `Error while evaluating showOn rule "${rule.id}": ${e.message}\nIn formula:`,
                            e.context,
                            'with value',
                            e.value
                        );
                    } else if (e instanceof RitaError) {
                        console.warn(
                            `Error while evaluating showOn rule "${rule.id}": ${e.message}\nIn formula:`,
                            e.context
                        );
                    } else {
                        console.warn(
                            `Error while evaluating showOn rule "${rule.id}": ${e.message}`
                        );
                    }
                });
        });
        return show;
    }
}

export function computedShowOnLogic(
    layoutElement: LayoutElement,
    descendantControlOverrides: DescendantControlOverrides | undefined
): Ref<boolean> {
    let localLayoutElement = layoutElement;
    if (layoutElement.type === 'Control') {
        localLayoutElement = mergeDescendantControlOptionsOverrides(
            layoutElement,
            descendantControlOverrides
        );
    }

    if (!isDependentElement(localLayoutElement)) {
        return ref(true);
    } else {
        return checkDependentElement(localLayoutElement);
    }
}

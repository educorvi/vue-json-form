import {
    type ComputedRef,
    inject,
    type InjectionKey,
    provide,
    type Ref,
} from 'vue';
import type {
    Control,
    DescendantControlOverride,
    DescendantControlOverrides,
} from '@educorvi/vue-json-form-schemas';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import { cleanScope } from '@/computedProperties/json';
import type { LanguageProvider } from '@/intl/LanguageProvider.ts';

// export const layoutProviderKey = Symbol() as InjectionKey<Control>;
// export const jsonElementProviderKey = Symbol() as InjectionKey<JSONSchema>;
export const formStructureProviderKey = Symbol() as InjectionKey<
    Ref<{
        jsonElement: JSONSchema;
        uiElement: Control;
    }>
>;
export const requiredProviderKey = Symbol() as InjectionKey<boolean>;

export const savePathOverrideProviderKey = Symbol() as InjectionKey<
    string | undefined
>;

export const savePathProviderKey = Symbol() as InjectionKey<string>;

export const descendantControlOverridesProviderKey =
    Symbol() as InjectionKey<DescendantControlOverrides>;

export const languageProviderKey = Symbol() as InjectionKey<
    LanguageProvider | undefined
>;

export function setDescendantControlOverrides(
    overrides?: DescendantControlOverrides
) {
    if (!overrides) return;
    for (const [scope, options] of Object.entries(overrides)) {
        setDescendantControlOverride(scope, options);
    }
}

export function setDescendantControlOverride(
    scope: string,
    overrides: DescendantControlOverride
) {
    let overridesMap = inject(descendantControlOverridesProviderKey);
    if (!overridesMap) {
        overridesMap = {};
    }
    let oldOverrides = overridesMap[scope];
    if (oldOverrides) {
        overridesMap[scope] = {
            showOn: overrides.showOn || oldOverrides.showOn,
            options: {
                ...oldOverrides.options,
                ...overrides.options,
            },
        };
    } else {
        overridesMap[scope] = overrides;
    }
    provide(descendantControlOverridesProviderKey, overridesMap);
}

export function mergeDescendantControlOptionsOverrides(
    control: Control,
    overridesMap: DescendantControlOverrides | undefined
): Control {
    if (!overridesMap) return control;

    const cleanedScope = cleanScope(control.scope);

    const controlOverrides = overridesMap[cleanedScope];
    if (!controlOverrides) return control;

    return {
        ...control,
        options: { ...control.options, ...controlOverrides.options },
        showOn: controlOverrides.showOn || control.showOn,
    };
}

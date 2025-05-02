import { inject, type InjectionKey, provide } from 'vue';
import type {
    Control,
    DescendantControlOverride,
    DescendantControlOverrides,
} from '@/typings/ui-schema';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import { cleanScope } from '@/computedProperties/json';

export const layoutProviderKey = Symbol() as InjectionKey<Control>;
export const jsonElementProviderKey =
    Symbol() as InjectionKey<CoreSchemaMetaSchema>;

export const requiredProviderKey = Symbol() as InjectionKey<boolean>;

export const savePathOverrideProviderKey = Symbol() as InjectionKey<
    string | undefined
>;

export const savePathProviderKey = Symbol() as InjectionKey<string>;

export const descendantControlOverridesProviderKey =
    Symbol() as InjectionKey<DescendantControlOverrides>;

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
    const overridesMap: DescendantControlOverrides = inject(
        descendantControlOverridesProviderKey,
        {}
    );
    overridesMap[scope] = overrides;
    provide(descendantControlOverridesProviderKey, overridesMap);
}

export function mergeDescendantControlOptionsOverrides(
    control: Control
): Control {
    const overridesMap: DescendantControlOverrides | undefined = inject(
        descendantControlOverridesProviderKey
    );
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

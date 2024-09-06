import { inject, type InjectionKey, provide } from 'vue';
import type {
    Control,
    DescendantControlOptionsOverrides,
    Options,
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

export const descendantControlOptionsOverridesProviderKey =
    Symbol() as InjectionKey<DescendantControlOptionsOverrides>;

export function setDescendantControlOptionsOverrides(
    overrides?: DescendantControlOptionsOverrides
) {
    if (!overrides) return;
    for (const [scope, options] of Object.entries(overrides)) {
        setDescendantControlOptionsOverride(scope, options);
    }
}

export function setDescendantControlOptionsOverride(
    scope: string,
    overrides: Options
) {
    const overridesMap: DescendantControlOptionsOverrides = inject(
        descendantControlOptionsOverridesProviderKey,
        {}
    );
    overridesMap[scope] = overrides;
    provide(descendantControlOptionsOverridesProviderKey, overridesMap);
}

export function mergeDescendantControlOptionsOverrides(
    control: Control
): Control {
    const overridesMap: DescendantControlOptionsOverrides | undefined = inject(
        descendantControlOptionsOverridesProviderKey
    );
    if (!overridesMap) return control;

    const cleanedScope = cleanScope(control.scope);

    const controlOverrides = overridesMap[cleanedScope];
    if (!controlOverrides) return control;

    return { ...control, options: { ...control.options, ...controlOverrides } };
}

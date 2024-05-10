import type { InjectionKey } from 'vue';
import type { Control } from '@/typings/ui-schema';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';

export const layoutProviderKey = Symbol() as InjectionKey<Control>;
export const jsonElementProviderKey =
    Symbol() as InjectionKey<CoreSchemaMetaSchema>;

export const requiredProviderKey = Symbol() as InjectionKey<boolean>;

export const savePathOverrideProviderKey = Symbol() as InjectionKey<
    string | undefined
>;

export const savePathProviderKey = Symbol() as InjectionKey<string>;

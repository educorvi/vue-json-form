import type { InjectionKey } from 'vue';
import type { Control } from '@/typings/ui-schema';

export const layoutProviderKey = Symbol() as InjectionKey<Control>;
export const jsonElementProviderKey = Symbol() as InjectionKey<Record<any, any>>;

export const requiredProviderKey = Symbol() as InjectionKey<boolean>;

import type { DefineComponent } from 'vue';
import type { ButtonVariant } from 'bootstrap-vue-next';

type ToRuntimeEmits<T> = {
    [K in keyof T]: T[K] extends any[] ? (...args: T[K]) => boolean : any;
};

type ComponentWithPropsAndEmits<
    Props = {},
    Emits extends Record<string, any[]> = {},
> = DefineComponent<Props, {}, {}, {}, {}, {}, {}, ToRuntimeEmits<Emits>>;

export interface ArrayButtonProps {
    disabled?: boolean;
    ariaLabel?: string;
    variant?: ButtonVariant;
}

export type ArrayButtonEmits = {
    click: [];
};

export type ArrayButtonComponent = ComponentWithPropsAndEmits<
    ArrayButtonProps,
    ArrayButtonEmits
>;

import type { RenderInterface } from '@/renderings/RenderInterface.ts';
import ConfirmationModal from '@/renderings/default/ConfirmationModal.vue';
import type { InvertOptionality, Prettify } from '@/typings/customTypes.ts';

export type DefaultComponents = Prettify<InvertOptionality<RenderInterface>>;

export const defaultComponents: DefaultComponents = {
    ConfirmationModal: ConfirmationModal,
};

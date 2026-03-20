export type { RenderInterface } from './renderings/RenderInterface.ts';

// TODO Remove direct export
/**
 * @deprecated Import from `RenderInterfaces` instead
 */
export * from '@/renderings/bootstrap/BootstrapComponents';

export * as RenderInterfaces from '@/renderings';

import VueJsonForm from '@/components/FormRoot.vue';
export { VueJsonForm };

export type * from '@educorvi/vue-json-form-schemas';
export type * from '@/typings/customTypes';
export * from '@/typings/typeValidators';
export {
    generateUISchema,
    SUPPORTED_UISCHEMA_VERSION as supportedUiSchemaVersion,
} from '@/Commons';

export * from '@/Mappers';

export * from '@/intl/LanguageProvider';

export * from '@/renderings/RenderInterface.ts';
export * from '@/renderings/PropsAndEmitsForRenderings.ts';

export * from '@/formControlInputValidation';

export * as RenderHelpers from '@/renderings/renderHelpers';

export const version: string = import.meta.env.PACKAGE_VERSION as string;

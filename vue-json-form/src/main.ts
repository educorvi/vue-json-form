export type { RenderInterface } from './RenderInterface';
// export type * from '@educorvi/vue-json-form-schemas';

export * from '@/renderings/bootstrap/BootstrapComponents';

import VueJsonForm from '@/components/FormRoot.vue';
export { VueJsonForm };

export type * from '@educorvi/vue-json-form-schemas';
export type * from '@/typings/customTypes';
export * from '@/typings/typeValidators';
export {
    generateUISchema,
    SUPPORTED_UISCHEMA_VERSION as supportedUiSchemaVersion,
} from '@/Commons';

export * from '@/MapperFunctions/oneOfToEnum';

export * from '@/intl/LanguageProvider';

import './RenderInterface';

export const version: string = import.meta.env.PACKAGE_VERSION as string;

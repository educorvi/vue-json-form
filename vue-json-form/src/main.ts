import { version } from '../package.json';

export type { RenderInterface } from './RenderInterface';
// export type * from '@/typings/ui-schema';

export * from '@/renderings/plain/PlainComponents';
export * from '@/renderings/bootstrap/BootstrapComponents';

import VueJsonForm from '@/components/FormRoot.vue';
export { VueJsonForm };

export type * from '@/typings/ui-schema';
export type * from '@/typings/json-schema';
export type * from '@/typings/customTypes';
export * from '@/typings/typeValidators';
export { generateUISchema } from '@/Commons';

export * from '@/MapperFunctions/oneOfToEnum';

import './RenderInterface';

export { version };

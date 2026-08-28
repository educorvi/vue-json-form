import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createBootstrap } from 'bootstrap-vue-next';
import type { JSONSchema, UISchema } from '@educorvi/vue-json-form';
import VueJsonFormBuilder from '../../src/App.vue';

/**
 * PoC component tests — mounted, local mode only (no collab/keycloak
 * props), asserting the public contract (props/events/DOM) a host app
 * relies on. Element add/move/delete is covered at the store level
 * instead (tests/unit/form-builder-engine.test.ts) — happy-dom has no real
 * pointer/drag events, so that part is exercised through the same store
 * API the UI's drag handlers call.
 */

const globalOptions = { plugins: [createBootstrap()] };

const NAME_JSON_SCHEMA_OBJ: JSONSchema = {
    type: 'object',
    properties: { name: { type: 'string', title: 'Name' } },
    required: ['name'],
};
const NAME_UI_SCHEMA_OBJ: UISchema = {
    version: '2.0',
    layout: {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/name' }],
    },
};
const NAME_JSON_SCHEMA = JSON.stringify(NAME_JSON_SCHEMA_OBJ);
const NAME_UI_SCHEMA = JSON.stringify(NAME_UI_SCHEMA_OBJ);

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('<VueJsonFormBuilder> (local mode)', () => {
    it('shows the header by default', () => {
        const wrapper = mount(VueJsonFormBuilder, { global: globalOptions });
        expect(wrapper.find('.app-header').exists()).toBe(true);
        wrapper.unmount();
    });

    it('hides the header when hideHeader is set', () => {
        const wrapper = mount(VueJsonFormBuilder, {
            props: { hideHeader: true },
            global: globalOptions,
        });
        expect(wrapper.find('.app-header').exists()).toBe(false);
        wrapper.unmount();
    });

    it('renders canvas content derived from the jsonSchema/uiSchema props', () => {
        const wrapper = mount(VueJsonFormBuilder, {
            props: { jsonSchema: NAME_JSON_SCHEMA, uiSchema: NAME_UI_SCHEMA },
            global: globalOptions,
        });
        expect(wrapper.find('[data-element-type="string"]').exists()).toBe(
            true
        );
        wrapper.unmount();
    });

    it('emits vjfb-change and vjfb-definition-change reflecting the imported schema', async () => {
        const wrapper = mount(VueJsonFormBuilder, {
            props: { jsonSchema: NAME_JSON_SCHEMA, uiSchema: NAME_UI_SCHEMA },
            global: globalOptions,
        });

        await sleep(400); // useDefinitionEmit debounces 300ms

        const changeEvents = wrapper.emitted('vjfb-change');
        const definitionEvents = wrapper.emitted('vjfb-definition-change');
        expect(changeEvents).toBeTruthy();
        expect(definitionEvents).toBeTruthy();

        const [emittedJsonSchema] = changeEvents![changeEvents!.length - 1] as [
            JSONSchema,
            UISchema,
        ];
        expect(emittedJsonSchema).toMatchObject({
            type: 'object',
            properties: { name: { type: 'string' } },
        });

        wrapper.unmount();
    });

    it('re-imports and re-emits when the jsonSchema/uiSchema props change (export round-trip)', async () => {
        const wrapper = mount(VueJsonFormBuilder, {
            props: { jsonSchema: NAME_JSON_SCHEMA, uiSchema: NAME_UI_SCHEMA },
            global: globalOptions,
        });
        await sleep(400);
        const emitsBefore = wrapper.emitted('vjfb-change')!.length;

        const emailJsonSchemaObj: JSONSchema = {
            type: 'object',
            properties: { email: { type: 'string', title: 'Email' } },
        };
        const emailUiSchemaObj: UISchema = {
            version: '2.0',
            layout: {
                type: 'VerticalLayout',
                elements: [{ type: 'Control', scope: '#/properties/email' }],
            },
        };
        await wrapper.setProps({
            jsonSchema: JSON.stringify(emailJsonSchemaObj),
            uiSchema: JSON.stringify(emailUiSchemaObj),
        });
        await sleep(400);

        expect(wrapper.emitted('vjfb-change')!.length).toBeGreaterThan(
            emitsBefore
        );
        // old field is gone, new field is rendered — proves the prop change
        // actually replaced the form rather than merging into it
        expect(wrapper.find('[data-element-type="string"]').text()).toContain(
            'Email'
        );

        const changeEvents = wrapper.emitted('vjfb-change')!;
        const [lastJsonSchema] = changeEvents[changeEvents.length - 1] as [
            JSONSchema,
            UISchema,
        ];
        expect(lastJsonSchema).toMatchObject({
            properties: { email: { type: 'string' } },
        });

        wrapper.unmount();
    });
});

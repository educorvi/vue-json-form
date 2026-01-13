import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UnknownComponent from '@/components/UnknownComponent.vue';

describe('UnknownComponent', () => {
    it('renders the unknown component message', () => {
        const wrapper = mount(UnknownComponent);
        expect(wrapper.text()).toBe('Unknown Component');
    });
});

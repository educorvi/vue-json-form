import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Divider from '@/components/LayoutElements/Divider.vue';

describe('Divider', () => {
    it('renders an hr element', () => {
        const wrapper = mount(Divider);
        expect(wrapper.find('hr').exists()).toBe(true);
    });
});

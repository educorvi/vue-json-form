import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import htmlRenderer from '@/components/LayoutElements/htmlRenderer.vue';

describe('htmlRenderer', () => {
    it('renders sanitized HTML content', () => {
        const layoutElement = {
            htmlData: '<p>Hello <strong>World</strong></p>',
        };
        const wrapper = mount(htmlRenderer, {
            props: { layoutElement },
        });
        
        expect(wrapper.find('p').exists()).toBe(true);
        expect(wrapper.find('strong').exists()).toBe(true);
        expect(wrapper.text()).toContain('Hello');
        expect(wrapper.text()).toContain('World');
    });

    it('sanitizes dangerous HTML content', () => {
        const layoutElement = {
            htmlData: '<p>Safe content</p><script>alert("xss")</script>',
        };
        const wrapper = mount(htmlRenderer, {
            props: { layoutElement },
        });
        
        expect(wrapper.find('p').exists()).toBe(true);
        expect(wrapper.find('script').exists()).toBe(false);
        expect(wrapper.text()).toContain('Safe content');
    });

    it('allows images with sanitization', () => {
        const layoutElement = {
            htmlData: '<img src="test.jpg" alt="test" />',
        };
        const wrapper = mount(htmlRenderer, {
            props: { layoutElement },
        });
        
        expect(wrapper.find('img').exists()).toBe(true);
    });

    it('allows links with sanitization', () => {
        const layoutElement = {
            htmlData: '<a href="https://example.com">Link</a>',
        };
        const wrapper = mount(htmlRenderer, {
            props: { layoutElement },
        });
        
        expect(wrapper.find('a').exists()).toBe(true);
        expect(wrapper.text()).toBe('Link');
    });

    it('applies the vjf_htmlRenderer class', () => {
        const layoutElement = {
            htmlData: '<p>Content</p>',
        };
        const wrapper = mount(htmlRenderer, {
            props: { layoutElement },
        });
        
        expect(wrapper.find('.vjf_htmlRenderer').exists()).toBe(true);
    });

    it('allows style and class attributes', () => {
        const layoutElement = {
            htmlData: '<p style="color: red;" class="custom-class">Styled</p>',
        };
        const wrapper = mount(htmlRenderer, {
            props: { layoutElement },
        });
        
        const p = wrapper.find('p');
        expect(p.exists()).toBe(true);
        expect(p.classes()).toContain('custom-class');
    });
});

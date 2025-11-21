import type { Component } from 'vue';
import type { ArrayButtonComponent } from '@/renderings/PropsAndEmitsForRenderings.ts';

export interface RenderInterface {
    /**
     * Wrapper component for showOn
     */
    showOnWrapper?: Component;

    CheckboxControl?: Component;

    CheckboxGroupControl?: Component;

    DefaultControl?: Component;

    FileControl?: Component;

    NumberControl?: Component;

    ObjectControl?: Component;

    RadiobuttonControl?: Component;

    SelectControl?: Component;

    StringControl?: Component;

    TagsControl?: Component;

    FormFieldWrapper?: Component;

    ErrorViewer?: Component;

    Button?: Component;

    Buttongroup?: Component;

    HelpPopover?: Component;

    Wizard?: Component;

    ArrayButton?: ArrayButtonComponent;
}

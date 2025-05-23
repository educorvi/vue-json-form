import type { Component } from 'vue';

export interface RenderInterface {
    /**
     * Wrapper component for showOn
     */
    showOnWrapper?: Component;

    ArrayControl?: Component;

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
}

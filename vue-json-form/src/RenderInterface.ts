import type ShowOnWrapper from '@/defaultRendering/showOnWrapper.vue';
import type ArrayControl from '@/defaultRendering/controls/Array/ArrayControl.vue';
import type CheckboxControl from '@/defaultRendering/controls/CheckboxControl.vue';
import type CheckboxGroupControl from '@/defaultRendering/controls/CheckboxGroupControl.vue';
import type DateTimeControl from '@/defaultRendering/controls/DateTimeControl.vue';
import type DefaultControl from '@/defaultRendering/controls/DefaultControl.vue';
import type FileControl from '@/defaultRendering/controls/FileControl.vue';
import type NumberControl from '@/defaultRendering/controls/NumberControl.vue';
import type ObjectControl from '@/defaultRendering/controls/ObjectControl.vue';
import type RadiobuttonControl from '@/defaultRendering/controls/RadiobuttonControl.vue';
import type SelectControl from '@/defaultRendering/controls/SelectControl.vue';
import type StringControl from '@/defaultRendering/controls/StringControl.vue';
import type TagsControl from '@/defaultRendering/controls/TagsControl.vue';

export interface RenderInterface {
    /**
     * Wrapper component for showOn
     */
    showOnWrapper?: typeof ShowOnWrapper;

    ArrayControl?: typeof ArrayControl;

    CheckboxControl?: typeof CheckboxControl;

    CheckboxGroupControl?: typeof CheckboxGroupControl;

    DateTimeControl?: typeof DateTimeControl;

    DefaultControl?: typeof DefaultControl;

    FileControl?: typeof FileControl;

    NumberControl?: typeof NumberControl;

    ObjectControl?: typeof ObjectControl;

    RadiobuttonControl?: typeof RadiobuttonControl;

    SelectControl?: typeof SelectControl;

    StringControl?: typeof StringControl;

    TagsControl?: typeof TagsControl;
}

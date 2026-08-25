import type { Component } from 'vue';
import type {
    Form,
    FormElement,
} from '@educorvi/vue-json-forms-builder-schemas';

/**
 * UI metadata for one schema element class — everything the builder needs
 * to render an element in the tree, canvas and settings panel.
 *
 * These classes live in the form builder package (not the schemas): the
 * schema classes stay free of UI concerns and only know how to serialize
 * themselves (toUiSchema / toJsonSchema / toLeaf*). Each ElementUi subclass
 * decides how the element it wraps is presented — icon, label, settings
 * component, and the display-relevant facts (data type, required, hidden).
 */
export abstract class ElementUi<
    T extends FormElement | Form = FormElement | Form,
> {
    /** Settings panel title, e.g. "String Settings". */
    abstract settingsLabel: string;

    /** Settings component rendered in the right panel, or null if the
     *  element has no settings UI. */
    abstract settingsComponent: Component | null;

    /** Bootstrap icon class shown in the tree and canvas. */
    icon(_el: T): string {
        return 'bi bi-question-circle';
    }

    /** Human-readable label for the tree and canvas. */
    label(el: T): string {
        return el.id;
    }

    /** JSON-Schema data type the element contributes, if it holds data. */
    dataType(_el: T): string | undefined {
        return undefined;
    }

    /** Whether the element must be filled in. */
    isRequired(_el: T): boolean {
        return false;
    }

    /** Whether the element is hidden in the rendered form. */
    isHidden(_el: T): boolean {
        return false;
    }
}

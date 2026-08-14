import {
    Form,
    StringElement,
    ColorElement,
    TimeElement,
    NumberElement,
    BooleanElement,
    EnumElement,
    CheckboxGroupElement,
    FileuploadElement,
    ArrayElement,
    ObjectElement,
    HTMLElement,
    DividerElement,
    ModalElement,
    SubmitButton,
    ResetButton,
    ButtonGroupElement,
    ReferenceElement,
    NumberFormat,
    type BaseDataElement,
    type SimpleElement,
    type FormElement,
} from '@educorvi/vue-json-form-builder-schemas';
import { ElementUi } from './ElementUi';
import FormSettings from '@/components/RightPanel/settings/FormSettings.vue';
import StringElementSettings from '@/components/RightPanel/settings/StringElementSettings.vue';
import NumberElementSettings from '@/components/RightPanel/settings/NumberElementSettings.vue';
import BooleanElementSettings from '@/components/RightPanel/settings/BooleanElementSettings.vue';
import EnumElementSettings from '@/components/RightPanel/settings/EnumElementSettings.vue';
import CheckboxGroupElementSettings from '@/components/RightPanel/settings/CheckboxGroupElementSettings.vue';
import FileuploadElementSettings from '@/components/RightPanel/settings/FileuploadElementSettings.vue';
import ArrayElementSettings from '@/components/RightPanel/settings/ArrayElementSettings.vue';
import ObjectElementSettings from '@/components/RightPanel/settings/ObjectElementSettings.vue';
import HtmlElementSettings from '@/components/RightPanel/settings/HtmlElementSettings.vue';
import ModalElementSettings from '@/components/RightPanel/settings/ModalElementSettings.vue';
import SubmitButtonSettings from '@/components/RightPanel/settings/SubmitButtonSettings.vue';
import ResetButtonSettings from '@/components/RightPanel/settings/ResetButtonSettings.vue';
import ButtonGroupSettings from '@/components/RightPanel/settings/ButtonGroupSettings.vue';
import ReferenceElementSettings from '@/components/RightPanel/settings/ReferenceElementSettings.vue';

// ─── Concrete UIs, one per schema element class ────────────────────────────

/** Elements with a title — shown with the title instead of the id. */
abstract class BaseDataElementUi<
    T extends BaseDataElement = BaseDataElement,
> extends ElementUi<T> {
    label(el: T): string {
        return el.data.title || el.id;
    }

    isHidden(el: T): boolean {
        return el.data.hidden;
    }
}

/** Data elements with a required flag. */
abstract class SimpleElementUi<
    T extends SimpleElement = SimpleElement,
> extends BaseDataElementUi<T> {
    isRequired(el: T): boolean {
        return el.required;
    }
}

class StringElementUi extends SimpleElementUi<StringElement> {
    settingsLabel = 'String Settings';
    settingsComponent = StringElementSettings;
    icon(): string {
        return 'bi bi-pencil';
    }
    dataType(): string {
        return 'string';
    }
}

class ColorElementUi extends SimpleElementUi<ColorElement> {
    settingsLabel = 'Color Settings';
    settingsComponent = StringElementSettings;
    icon(): string {
        return 'bi bi-palette';
    }
    dataType(): string {
        return 'string';
    }
}

class TimeElementUi extends SimpleElementUi<TimeElement> {
    settingsLabel = 'Time Settings';
    settingsComponent = StringElementSettings;
    icon(): string {
        return 'bi bi-clock';
    }
    dataType(): string {
        return 'string';
    }
}

class DividerElementUi extends ElementUi<DividerElement> {
    settingsLabel = 'Divider Settings';
    settingsComponent = null;
    icon(): string {
        return 'bi bi-hr';
    }
    label(el: DividerElement): string {
        return 'Divider';
    }
}

class NumberElementUi extends SimpleElementUi<NumberElement> {
    settingsLabel = 'Number Settings';
    settingsComponent = NumberElementSettings;
    icon(): string {
        return 'bi bi-123';
    }
    dataType(el: NumberElement): string {
        return el.format === NumberFormat.Integer ? 'integer' : 'number';
    }
}

class BooleanElementUi extends SimpleElementUi<BooleanElement> {
    settingsLabel = 'Boolean Settings';
    settingsComponent = BooleanElementSettings;
    icon(): string {
        return 'bi bi-check-square';
    }
    dataType(): string {
        return 'boolean';
    }
}

class EnumElementUi extends SimpleElementUi<EnumElement> {
    settingsLabel = 'Select Settings';
    settingsComponent = EnumElementSettings;
    icon(): string {
        return 'bi bi-list';
    }
    dataType(): string {
        return 'string';
    }
}

class CheckboxGroupElementUi extends SimpleElementUi<CheckboxGroupElement> {
    settingsLabel = 'Checkbox Group Settings';
    settingsComponent = CheckboxGroupElementSettings;
    icon(): string {
        return 'bi bi-check2-square';
    }
    dataType(): string {
        return 'array';
    }
}

class FileuploadElementUi extends SimpleElementUi<FileuploadElement> {
    settingsLabel = 'File Upload Settings';
    settingsComponent = FileuploadElementSettings;
    icon(): string {
        return 'bi bi-file-earmark-arrow-up';
    }
    dataType(): string {
        return 'array';
    }
}

class ArrayElementUi extends ElementUi<ArrayElement> {
    settingsLabel = 'Array Settings';
    settingsComponent = ArrayElementSettings;
    icon(): string {
        return 'bi bi-list-ul';
    }
    dataType(): string {
        return 'array';
    }
    isRequired(el: ArrayElement): boolean {
        return el.required;
    }
}

class ObjectElementUi extends ElementUi<ObjectElement> {
    settingsLabel = 'Object Settings';
    settingsComponent = ObjectElementSettings;
    icon(): string {
        return 'bi bi-box';
    }
    dataType(): string {
        return 'object';
    }
}

class HtmlElementUi extends ElementUi<HTMLElement> {
    settingsLabel = 'HTML Settings';
    settingsComponent = HtmlElementSettings;
    icon(): string {
        return 'bi bi-code';
    }
}

class ModalElementUi extends ElementUi<ModalElement> {
    settingsLabel = 'Modal Settings';
    settingsComponent = ModalElementSettings;
    icon(): string {
        return 'bi bi-window';
    }
    label(el: ModalElement): string {
        return el.data.title || el.id;
    }
}

class SubmitButtonUi extends ElementUi<SubmitButton> {
    settingsLabel = 'Submit Button Settings';
    settingsComponent = SubmitButtonSettings;
    icon(): string {
        return 'bi bi-send';
    }
}

class ResetButtonUi extends ElementUi<ResetButton> {
    settingsLabel = 'Reset Button Settings';
    settingsComponent = ResetButtonSettings;
    icon(): string {
        return 'bi bi-send';
    }
}

class ButtonGroupUi extends ElementUi<ButtonGroupElement> {
    settingsLabel = 'Button Group Settings';
    settingsComponent = ButtonGroupSettings;
    icon(): string {
        return 'bi bi-send';
    }
}

class ReferenceElementUi extends ElementUi<ReferenceElement> {
    settingsLabel = 'Reference Settings';
    settingsComponent = ReferenceElementSettings;
    icon(): string {
        return 'bi bi-link-45deg';
    }
}

class FormUi extends ElementUi<Form> {
    settingsLabel = 'Form Settings';
    settingsComponent = FormSettings;
    icon(): string {
        return 'bi bi-pencil-square';
    }
    label(el: Form): string {
        return el.data.title;
    }
}

// ─── Registry: schema element class → its UI ───────────────────────────────

const registry = new Map<Function, ElementUi<any>>([
    [Form, new FormUi()],
    [StringElement, new StringElementUi()],
    [ColorElement, new ColorElementUi()],
    [TimeElement, new TimeElementUi()],
    [NumberElement, new NumberElementUi()],
    [BooleanElement, new BooleanElementUi()],
    [EnumElement, new EnumElementUi()],
    [CheckboxGroupElement, new CheckboxGroupElementUi()],
    [FileuploadElement, new FileuploadElementUi()],
    [ArrayElement, new ArrayElementUi()],
    [ObjectElement, new ObjectElementUi()],
    [HTMLElement, new HtmlElementUi()],
    [DividerElement, new DividerElementUi()],
    [ModalElement, new ModalElementUi()],
    [SubmitButton, new SubmitButtonUi()],
    [ResetButton, new ResetButtonUi()],
    [ButtonGroupElement, new ButtonGroupUi()],
    [ReferenceElement, new ReferenceElementUi()],
]);

/** Fallback for classes without a registered UI — should not happen. */
class DefaultElementUi extends ElementUi {
    settingsLabel = 'Settings';
    settingsComponent = null;
}
const fallbackUi = new DefaultElementUi();

/** UI metadata for any element — keyed by its class, no instanceof cascades. */
export function uiFor(el: FormElement | Form): ElementUi<FormElement | Form> {
    return registry.get(el.constructor as Function) ?? fallbackUi;
}

export { ElementUi };

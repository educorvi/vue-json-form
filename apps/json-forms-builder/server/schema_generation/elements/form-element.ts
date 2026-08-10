import { z } from "zod";
import type { Control, JSONSchema, UISchema, HTMLRenderer, Options } from '@educorvi/vue-json-form-schemas';
import { createId } from "../utils";
import type { EntityOptionalKeys, PartialBy } from "./base";
import { DependencyGroup } from "./dependency";
import type { SchemaGenerator } from "./schema-generator";
import { Entity } from "./base";

const formElementDefaults = {};
export type FormElementOptionalKeys = keyof typeof formElementDefaults | EntityOptionalKeys;
type FormElementData = z.infer<typeof FormElement.schema>;
export abstract class FormElement extends Entity {
    data: FormElementData;

    static schema = super.schema.extend({
        // dependencyGroup: z.lazy((): typeof DependencyGroup.schema => DependencyGroup.schema).optional()
        dependencyGroup: z.string().optional()
    });

    constructor(
        data: PartialBy<FormElementData, FormElementOptionalKeys>
    ) {
        super(data);
        this.data = FormElement.setDefaults(data);
    }

    get dependencyGroup(): string | undefined {
        return this.data.dependencyGroup;
    }

    abstract toUiSchema(generator: SchemaGenerator, scope: string[]): Control | HTMLRenderer;

    abstract toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema;

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema, uiSchema: UISchema | Control | HTMLRenderer): FormElement {
        throw new Error("fromJsonSchemaAndUiSchema must be implemented in subclasses");
    }
}


type BaseDataElementData = z.infer<typeof BaseDataElement.schema>;
const baseDataElementDefaults = {hidden: false};
export type BaseDataElementOptionalKeys = keyof typeof baseDataElementDefaults | FormElementOptionalKeys;
export abstract class BaseDataElement extends FormElement {
    data: BaseDataElementData

    // more attributes
    static schema = FormElement.schema.extend({
        title: z.string(),
        description: z.string().optional(),
        tooltip: z.string().optional(),
        hidden: z.boolean(),
        preHtml: z.string().optional(),
        postHtml: z.string().optional(),
    });

    constructor(
        data: PartialBy<BaseDataElementData, BaseDataElementOptionalKeys>
    ) {
        super(data);
        this.data = BaseDataElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<BaseDataElementData, BaseDataElementOptionalKeys>): BaseDataElementData {
        return {
            ...super.setDefaults(data),
            ...baseDataElementDefaults,
            ...data,
        };
    }


    get title(): string {
        return this.data.title;
    }

    get description(): string | undefined {
        return this.data.description;
    }

    get tooltip(): string | undefined {
        return this.data.tooltip;
    }

    get hidden(): boolean {
        return this.data.hidden;
    }

    get preHtml(): string | undefined {
        return this.data.preHtml;
    }

    get postHtml(): string | undefined {
        return this.data.postHtml;
    }

    getUiSchemaOptions(): Options {
        const options: Options = {};
        if (this.data.tooltip) {
            options["tooltip"] = this.data.tooltip;
        }
        if (this.data.hidden) {
            options["hidden"] = this.data.hidden;
        }
        if (this.data.preHtml) {
            options["preHtml"] = this.data.preHtml;
        }
        if (this.data.postHtml) {
            options["postHtml"] = this.data.postHtml;
        }
        return options;
    }

}

type SimpleElementData = z.infer<typeof SimpleElement.schema>;
const simpleElementDefaults = {required: false};
export type SimpleElementOptionalKeys = keyof typeof simpleElementDefaults | BaseDataElementOptionalKeys;
export abstract class SimpleElement extends BaseDataElement {
    data: SimpleElementData;

    static schema = BaseDataElement.schema.extend({
        required: z.boolean(),
        appendValue: z.string().optional(),
        prependValue: z.string().optional(),
        pattern: z.string().optional()
    });

    constructor(
        data: PartialBy<SimpleElementData, SimpleElementOptionalKeys>
    ) {
        super(data);
        this.data = SimpleElement.setDefaults(data);
    }

    get required(): boolean {
        return this.data.required;
    }

    get appendValue(): string | undefined {
        return this.data.appendValue;
    }

    get prependValue(): string | undefined {
        return this.data.prependValue;
    }

    get pattern(): string | undefined {
        return this.data.pattern;
    }

    protected static setDefaults(data: PartialBy<SimpleElementData, SimpleElementOptionalKeys>): SimpleElementData {
        return {
            ...super.setDefaults(data),
            ...simpleElementDefaults,
            ...data,
        };
    }

    getUiSchemaOptions(): Options {
        const options = super.getUiSchemaOptions();
        if (this.data.appendValue) {
            options["appendValue"] = this.data.appendValue;
        }
        if (this.data.prependValue) {
            options["prependValue"] = this.data.prependValue;
        }
        if (this.data.pattern) {
            options["pattern"] = this.data.pattern;
        }
        return options;
    }
}
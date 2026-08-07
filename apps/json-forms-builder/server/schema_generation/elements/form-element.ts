import { z } from "zod";
import type { Control, JSONSchema, UISchema, HTMLRenderer, Options } from '@educorvi/vue-json-form-schemas';
import { createId } from "../utils";
import { DependencyGroup } from "./dependency";
import type { SchemaGenerator } from "./schema-generator";
import { Entity } from "./base";

type FormElementData = z.infer<typeof FormElement.schema>;
export abstract class FormElement extends Entity {
    data: FormElementData;

    static schema = super.schema.extend({
        dependencyGroup: z.lazy((): z.ZodTypeAny => DependencyGroup.schema).optional()
    });

    constructor(
        data: FormElementData
    ) {
        super(data);
        this.data = data;
    }

    abstract toUiSchema(generator: SchemaGenerator, scope: string[]): Control | HTMLRenderer;

    abstract toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema;

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: UISchema | Control | HTMLRenderer): FormElement {
        throw new Error("fromJsonSchemaAndUiSchema must be implemented in subclasses");
    }
}

type BaseDataElementData = z.infer<typeof BaseDataElement.schema>;
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
        data: BaseDataElementData
    ) {
        super(data);
        this.data = data;
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
export abstract class SimpleElement extends BaseDataElement {
    data: SimpleElementData;

    // more attributes
    static schema = BaseDataElement.schema.extend({
        required: z.boolean(),
        appendValue: z.string().optional(),
        prependValue: z.string().optional(),
        pattern: z.string().optional()
    });

    constructor(
        data: SimpleElementData
    ) {
        super(data);
        this.data = data;
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
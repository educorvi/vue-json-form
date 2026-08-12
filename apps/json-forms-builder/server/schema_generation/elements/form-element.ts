import { z } from "zod";
import type { Control, JSONSchema, UISchema, HTMLRenderer, Options, Divider, Button, Buttongroup, Modal } from '@educorvi/vue-json-form-schemas';
import { CombinedUiSchemaType, createId } from "../utils";
import type { EntityOptionalKeys, PartialBy } from "./base";
import { DependencyGroup } from "./dependency";
import type { SchemaGenerator } from "./schema-generator";
import { Entity } from "./base";
import { createShowOnProperty } from "./children-schema-utils";

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

    abstract toUiSchema(generator: SchemaGenerator, scope: string[]): CombinedUiSchemaType;

    abstract toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema;

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema, uiSchema: CombinedUiSchemaType): FormElement {
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
        tooltip: z.string().optional(), // TODO support label and variant?
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

    /**
     * @param scope the path in the json schema without its own id
     * @returns the full path as a string, path parts are separated by /
     */
    getScope(scope: string[]): string {
        return [...scope, this.id].join("/");
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        const schema: JSONSchema = {
            title: this.title,
        };
        if (this.description !== undefined) {
            schema.description = this.description;
        }
        return schema;
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const options: Options = {
            ...(this.tooltip && { help: {text: this.tooltip } }),
            ...(this.hidden && { hidden: this.hidden }),
            ...(this.preHtml && { preHtml: this.preHtml }),
            ...(this.postHtml && { postHtml: this.postHtml }),
        };

        const showOn = createShowOnProperty(this.dependencyGroup, _generator, _scope);

        const uiSchema: Control = {
            type: "Control",
            scope: this.getScope(_scope),
            ...(options && { options: options }),
            ...(showOn && { showOn: showOn }),
        };
        return uiSchema;

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
        default: z.any().optional(), // TODO move to subclasses and define the type correctly?
        // TODO disabled? forceRequired? label?
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

    get default(): any {
        return this.data.default;
    }

    protected static setDefaults(data: PartialBy<SimpleElementData, SimpleElementOptionalKeys>): SimpleElementData {
        return {
            ...super.setDefaults(data),
            ...simpleElementDefaults,
            ...data,
        };
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const uiSchema = super.toUiSchema(_generator, _scope);

        uiSchema.options = {
            ...(uiSchema.options && { ...uiSchema.options }),
            ...(this.appendValue && { appendValue: this.appendValue }),
            ...(this.prependValue && { prependValue: this.prependValue }),
        };

        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        const jsonSchema = super.toJsonSchema(_generator, _scope);
        if (this.default) {
            jsonSchema.default = this.default;
        }
        return jsonSchema;
    }

}
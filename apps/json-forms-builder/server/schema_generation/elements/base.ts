import { z } from "zod";
import type { Control, JSONSchema, UISchema, HTMLRenderer, Options } from '@educorvi/vue-json-form-schemas';
import { createId } from "../utils";

export abstract class Entity {
    id!: string;

    // more attributes
    static schema = z.object({
        id: z.string()
    });

    constructor(id?: string) {
        this.id = id ? createId(id) : createId(this.constructor.name);
    }

    getID(): string {
        return this.id;
    }
}

export class DependencyGroup extends Entity {
    // attributes
    static schema = Entity.schema.extend({});

    constructor(id?: string) {
        super(id);
    }

    toJsonSchema(): JSONSchema {
        return {
            //TODO: implement dependency group logic
        }
    }
}

export abstract class FormElement extends Entity {
    dependencyGroup?: DependencyGroup;

    static schema = Entity.schema.extend({
        dependencyGroup: DependencyGroup.schema.optional()
    });

    constructor(id?: string, dependencyGroup?: DependencyGroup) {
        super(id);
        this.dependencyGroup = dependencyGroup;
    }

    abstract toUiSchema(scope: string): Control | HTMLRenderer;

    abstract toJsonSchema(): JSONSchema;

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: UISchema | Control | HTMLRenderer): FormElement {
        throw new Error("fromJsonSchemaAndUiSchema must be implemented in subclasses");
    }
}

export abstract class BaseDataElement extends FormElement {
    title!: string;
    description?: string;
    tooltip?: string;
    hidden!: boolean;
    preHtml?: string;
    postHtml?: string;

    // more attributes
    static schema = FormElement.schema.extend({
        title: z.string(),
        description: z.string().optional(),
        tooltip: z.string().optional(),
        hidden: z.boolean(),
        preHtml: z.string().optional(),
        postHtml: z.string().optional(),
    });

    constructor(title: string, description?: string, dependencyGroup?: DependencyGroup, id?: string, tooltip?: string, hidden: boolean = false, preHtml?: string, postHtml?: string) {
        super(id ? id : title, dependencyGroup);
        this.title = title;
        this.description = description;
        this.tooltip = tooltip;
        this.hidden = hidden;
        this.preHtml = preHtml;
        this.postHtml = postHtml;
    }

    getUiSchemaOptions(): Options {
        const options: Options = {};
        if (this.tooltip) {
            options["tooltip"] = this.tooltip;
        }
        if (this.hidden) {
            options["hidden"] = this.hidden;
        }
        if (this.preHtml) {
            options["preHtml"] = this.preHtml;
        }
        if (this.postHtml) {
            options["postHtml"] = this.postHtml;
        }
        return options;
    }

}

export abstract class SimpleElement extends BaseDataElement {
    required!: boolean;
    appendValue?: string;
    prependValue?: string;
    pattern?: string;

    // more attributes
    static schema = BaseDataElement.schema.extend({
        required: z.boolean(),
        appendValue: z.string().optional(),
        prependValue: z.string().optional(),
        pattern: z.string().optional()
    });

    constructor(title: string, description?: string, required: boolean = false, dependencyGroup?: DependencyGroup, id?: string, tooltip?: string, hidden: boolean = false, preHtml?: string, postHtml?: string, appendValue?: string, prependValue?: string, pattern?: string) {
        super(title, description, dependencyGroup, id, tooltip, hidden, preHtml, postHtml);
        this.required = required;
        this.appendValue = appendValue;
        this.prependValue = prependValue;
        this.pattern = pattern;
    }

    getUiSchemaOptions(): Options {
        const options = super.getUiSchemaOptions();
        if (this.appendValue) {
            options["appendValue"] = this.appendValue;
        }
        if (this.prependValue) {
            options["prependValue"] = this.prependValue;
        }
        if (this.pattern) {
            options["pattern"] = this.pattern;
        }
        return options;
    }
}


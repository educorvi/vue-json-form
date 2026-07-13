import { z } from "zod";
import type { Control, JSONSchema, UISchema, HTMLRenderer } from '@educorvi/vue-json-form-schemas';
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

    constructor(id: string, dependencyGroup?: DependencyGroup) {
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

    // more attributes
    static schema = FormElement.schema.extend({
        title: z.string(),
        description: z.string().optional()
    });

    constructor(title: string, description?: string, dependencyGroup?: DependencyGroup, id?: string) {
        super(id ? id : title, dependencyGroup);
        this.title = title;
        this.description = description;
    }

}

export abstract class SimpleElement extends BaseDataElement {
    required!: boolean;

    // more attributes
    static schema = BaseDataElement.schema.extend({
        required: z.boolean()
    });

    constructor(title: string, description?: string, required: boolean = false, dependencyGroup?: DependencyGroup, id?: string) {
        super(title, description, dependencyGroup, id);
        this.required = required;
    }
}


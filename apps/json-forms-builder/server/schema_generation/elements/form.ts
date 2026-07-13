import { Entity, FormElement } from "./base";
import { z } from "zod";
import { childrenToUiSchema, getObjectJsonSchema } from "./childrenSchemaUtils";
import type { JSONSchema, UISchema } from '@educorvi/vue-json-form-schemas';
import { Layout, getBaseJsonSchema } from "../utils";


export class Form extends Entity {
    readonly type = "form";
    title!: string;
    description?: string;
    layout!: Layout; //TODO oder wizard??
    children!: FormElement[];
    requiredList!: string[];

    static schema = super.schema.extend({
        title: z.string(),
        description: z.string().optional(),
        children: z.array(z.lazy(() => FormElement.schema)),
        requiredList: z.array(z.string())
    });

	constructor(title: string, description?: string, id?: string, layout: Layout = Layout.Vertical) {
        super(id);
		this.title = title;
		this.description = description;
        this.layout = layout;
		this.children = [];
		this.requiredList = [];
	}

    getScopePart(): string {
        return "/properties/";
    }

	toUiSchema(): UISchema {
        const uiSchema: UISchema = {
            "$schema": "TODO",
            "version": "2.1",
            "layout": {
                "type": this.layout,
                "elements": []
            }
        }
        if (this.children && this.children.length > 0) {
            uiSchema.layout.elements = childrenToUiSchema("/properties/", this.children);
        }
		return uiSchema
	}

	toJsonSchema(): JSONSchema {
        return getObjectJsonSchema(this.title, this.children, this.description);
	}
}

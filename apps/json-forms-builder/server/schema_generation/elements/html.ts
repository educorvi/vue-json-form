import { z } from "zod";
import type { JSONSchema, HTMLRenderer } from '@educorvi/vue-json-form-schemas';
import { FormElement } from "./form-element";
import type { DependencyGroup } from "./dependency";
import type { SchemaGenerator } from "./schema-generator";


export class HTMLElement extends FormElement {
    readonly type = "html";

    htmlData!: string;

    static schema = FormElement.schema.extend({
        type: z.literal("html"),
        htmlData: z.string()
    });

    constructor(
        htmlData: string,
        dependencyGroup?: DependencyGroup,
        id?: string
    ) {
        super(id || "html_element", dependencyGroup);
        this.htmlData = htmlData;
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[]): HTMLRenderer {
        const html: HTMLRenderer = {
            "type": "HTML",
            "htmlData": this.htmlData
        };
        if (this.dependencyGroup) {
            html.showOn = this.dependencyGroup.toUiSchema(_generator, scope);
        }
        return html;
    }

    toJsonSchema(_generator: SchemaGenerator, scope: string[]): JSONSchema {
        return {};
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema={}, uiSchema: HTMLRenderer): HTMLElement {
        let htmlElement = new HTMLElement(uiSchema.htmlData);
        // TODO handle dependencyGroup if needed
        return htmlElement;
    }
}
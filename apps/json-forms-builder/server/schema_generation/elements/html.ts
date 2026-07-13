import { z } from "zod";
import type { JSONSchema, HTMLRenderer } from '@educorvi/vue-json-form-schemas';
import { FormElement, DependencyGroup } from "../base";


export class HTMLElement extends FormElement {
    readonly type = "html";

    htmlData!: string;

    static schema = FormElement.schema.extend({
        type: z.literal("html"),
        htmlData: z.string()
    });

    constructor(htmlData: string, dependencyGroup?: DependencyGroup, id?: string) {
        super(id || "html_element", dependencyGroup);
        this.htmlData = htmlData;
    }

    toUiSchema(scope: string): HTMLRenderer {
        return {
            "type": "HTML",
            "htmlData": this.htmlData
        };
    }

    toJsonSchema(): JSONSchema {
        return {};
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema={}, uiSchema: HTMLRenderer): HTMLElement {
        let htmlElement = new HTMLElement(uiSchema.htmlData);
        // TODO handle dependencyGroup if needed
        return htmlElement;
    }
}
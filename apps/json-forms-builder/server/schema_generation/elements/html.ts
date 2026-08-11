import { z } from "zod";
import type { JSONSchema, HTMLRenderer } from '@educorvi/vue-json-form-schemas';
import { FormElement, FormElementOptionalKeys } from "./form-element";
import type { DependencyGroup } from "./dependency";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";
import { createShowOnProperty } from "./children-schema-utils";


type HTMLElementData = z.infer<typeof HTMLElement.schema>;
const htmlElementDefaults = {type: "html" as const};
type HTMLElementOptionalKeys = keyof typeof htmlElementDefaults | FormElementOptionalKeys;
export class HTMLElement extends FormElement {
    data: HTMLElementData;

    static schema = FormElement.schema.extend({
        type: z.literal("html"),
        htmlData: z.string()
    });

    constructor(
        data: Omit<PartialBy<HTMLElementData, HTMLElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = HTMLElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<HTMLElementData, HTMLElementOptionalKeys>): HTMLElementData {
        return {
            ...super.setDefaults(data),
            ...htmlElementDefaults,
            ...data,
        };
    }

    get htmlData(): string {
        return this.data.htmlData;
    }

    toUiSchema(_generator: SchemaGenerator, scope: string[]): HTMLRenderer {
        const html: HTMLRenderer = {
            "type": "HTML",
            "htmlData": this.htmlData
        };

        const showOn = createShowOnProperty(this.dependencyGroup, _generator, scope);
        if (showOn) {
            html.showOn = showOn;
        }

        return html;
    }

    toJsonSchema(_generator: SchemaGenerator, scope: string[]): JSONSchema {
        return {};
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: HTMLRenderer): HTMLElement {
        let htmlElement = new HTMLElement(
            {
                id: id,
                htmlData: uiSchema.htmlData
            }
        );
        // TODO handle dependencyGroup if needed
        return htmlElement;
    }
}
import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { Entity, EntityOptionalKeys, PartialBy } from "./base";
import { createShowOnProperty } from "./children-schema-utils";
import { Form } from "./form";


type WizardPageData = z.infer<typeof WizardPage.schema>;
const wizardPageDefaults = {type: "wizard-page" as const};
type WizardPageOptionalKeys = keyof typeof wizardPageDefaults | EntityOptionalKeys;
export class WizardPage extends Entity {
    data: WizardPageData;

    static schema = super.schema.extend({
        type: z.literal("wizard-page"),
        form: z.string(),
        pageTitle: z.string(),
    });

    constructor(
        data: Omit<PartialBy<WizardPageData, WizardPageOptionalKeys>, "type">
    ) {
        super(data);
        this.data = WizardPage.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<WizardPageData, WizardPageOptionalKeys>): WizardPageData {
        return {
            ...super.setDefaults(data),
            ...wizardPageDefaults,
            ...data,
        };
    }

    get form(): string {
        return this.data.form;
    }

    get pageTitle(): string {
        return this.data.pageTitle;
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        const form = generator.document.getElementById(this.form);
        if (!(form instanceof Form)) {
            throw new Error(`Form with id ${this.form} not found or is not a Form element`);
        }

        const uiSchema = form.toUiSchema(generator);
        return uiSchema;
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const form = generator.document.getElementById(this.form);
        if (!(form instanceof Form)) {
            throw new Error(`Form with id ${this.form} not found or is not a Form element`);
        }

        const jsonSchema = form.toJsonSchema(generator, scope);
        return jsonSchema;
    }

    fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): WizardPage {
        // TODO
    }

}


type WizardData = z.infer<typeof Wizard.schema>;
const wizardDefaults = {type: "wizard" as const, wizardPages: []};
type WizardOptionalKeys = keyof typeof wizardDefaults | EntityOptionalKeys;
export class Wizard extends Entity {
    data: WizardData;

    static schema = super.schema.extend({
        type: z.literal("wizard"),
        wizardPages: z.array(z.string()),
        // title: z.string(),
        // description: z.string().optional(),
    });

    constructor(
        data: Omit<PartialBy<WizardData, WizardOptionalKeys>, "type">
    ) {
        super(data);
        this.data = Wizard.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<WizardData, WizardOptionalKeys>): WizardData {
        return {
            ...super.setDefaults(data),
            ...wizardDefaults,
            wizardPages: [...wizardDefaults.wizardPages], // clone so that each instance has its own array
            ...data,
        };
    }
}
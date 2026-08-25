import { z } from 'zod';
import type {
    JSONSchema,
    Layout as UiLayout,
    Wizard as UiWizard,
} from '@educorvi/vue-json-form-schemas';
import { Entity, EntityOptionalKeys, PartialBy } from './base';
import type { SchemaGenerator } from './schema-generator';
import { Form } from './form';

type WizardPageData = z.infer<typeof WizardPage.schema>;
const wizardPageDefaults = { type: 'wizard-page' as const };
type WizardPageOptionalKeys =
    keyof typeof wizardPageDefaults | EntityOptionalKeys;

/**
 * One wizard step. `wizardPageForm` is the uid of a Form entity (in the
 * flat elements set) whose children are rendered on this page.
 */
export class WizardPage extends Entity {
    data: WizardPageData;

    static schema = super.schema.extend({
        type: z.literal('wizard-page'),
        wizardPageForm: z.string(), // id to a Form
        pageTitle: z.string(),
    });

    constructor(
        data: Omit<PartialBy<WizardPageData, WizardPageOptionalKeys>, 'type'>
    ) {
        super(data);
        this.data = WizardPage.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<WizardPageData, WizardPageOptionalKeys>
    ): WizardPageData {
        return {
            ...super.setDefaults(data),
            ...wizardPageDefaults,
            ...data,
        };
    }

    get wizardPageForm(): string {
        return this.data.wizardPageForm;
    }

    get pageTitle(): string {
        return this.data.pageTitle;
    }

    toUiSchema(generator: SchemaGenerator, _scope: string[]): UiLayout {
        const wizardPageForm = generator.document.getElementById(
            this.wizardPageForm
        );
        if (!(wizardPageForm instanceof Form)) {
            throw new Error(
                `Wizard page with id ${this.wizardPageForm} not found or is not a Form`
            );
        }
        const formLayoutUiSchema: UiLayout = wizardPageForm.toLayoutUiSchema(
            generator,
            ['properties']
        );

        const uiSchema: UiLayout = {
            type: formLayoutUiSchema.type,
            elements: formLayoutUiSchema.elements,
        };
        return uiSchema;
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const wizardPageForm = generator.document.getElementById(
            this.wizardPageForm
        );
        if (!(wizardPageForm instanceof Form)) {
            throw new Error(
                `Wizard page with id ${this.wizardPageForm} not found or is not a Form`
            );
        }

        const jsonSchema = wizardPageForm.toJsonSchema(generator, scope);
        return jsonSchema;
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        _jsonSchema: JSONSchema = {},
        _uiSchema: UiLayout
    ): WizardPage {
        return new WizardPage({
            id: id,
            wizardPageForm: '',
            pageTitle: '',
        });
    }
}

type WizardData = z.infer<typeof Wizard.schema>;
const wizardDefaults = { type: 'wizard' as const, wizardPages: [] as string[] };
type WizardOptionalKeys = keyof typeof wizardDefaults | EntityOptionalKeys;

/** A wizard — the root UI element that renders its pages as steps. */
export class Wizard extends Entity {
    data: WizardData;

    static schema = super.schema.extend({
        type: z.literal('wizard'),
        wizardPages: z.array(z.string()), // uids of WizardPage entities
    });

    constructor(data: Omit<PartialBy<WizardData, WizardOptionalKeys>, 'type'>) {
        super(data);
        this.data = Wizard.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<WizardData, WizardOptionalKeys>
    ): WizardData {
        return {
            ...super.setDefaults(data),
            ...wizardDefaults,
            // wizardPages must never be a shared array
            wizardPages: data.wizardPages ? [...data.wizardPages] : [],
            ...data,
        };
    }

    get wizardPages(): string[] {
        return this.data.wizardPages;
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): UiWizard {
        const uiSchema: UiWizard = {
            type: 'Wizard',
            pages: this.wizardPages.map((pageId) => {
                const page = generator.document.getElementById(pageId);
                if (!(page instanceof WizardPage)) {
                    throw new Error(
                        `Wizard page with id ${pageId} not found or is not a WizardPage`
                    );
                }
                return page.toUiSchema(generator, scope) as unknown as UiLayout;
            }),
        };
        return uiSchema;
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const jsonSchema: JSONSchema = {
            type: 'object',
            properties: {},
        };

        const requiredList: string[] = [];
        for (const pageId of this.wizardPages) {
            const page = generator.document.getElementById(pageId);
            if (!(page instanceof WizardPage)) {
                throw new Error(
                    `Wizard page with id ${pageId} not found or is not a WizardPage`
                );
            }
            const pageJsonSchema = page.toJsonSchema(generator, scope);
            jsonSchema.properties![pageId] = pageJsonSchema;
            if (pageJsonSchema.required && pageJsonSchema.required.length > 0) {
                requiredList.push(pageId);
            }
        }

        jsonSchema.required = requiredList;
        return jsonSchema;
    }
}

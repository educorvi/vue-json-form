import type {
    Control,
    JSONSchema,
    Layout,
} from '@educorvi/vue-json-form-schemas';

export abstract class MapperWithoutData {
    abstract map(
        jsonElement: JSONSchema,
        uiElement: Control
    ): null | {
        jsonElement: JSONSchema;
        uiElement: Control;
    };
}

export abstract class MapperWithData {
    protected jsonSchema: Readonly<JSONSchema> | undefined;
    protected uiSchema: Readonly<Layout> | undefined;
    protected savePath: string | undefined;
    protected scope: string | undefined;
    abstract registerSchemata(
        jsonSchema: Readonly<JSONSchema>,
        uiSchema: Readonly<Layout>,
        scope: string,
        savePath: string
    ): void;
    abstract map(
        jsonElement: JSONSchema,
        uiElement: Control,
        data: Readonly<Record<string, any>>
    ): null | {
        jsonElement: JSONSchema;
        uiElement: Control;
    };

    abstract getDependencies(): string[];
}

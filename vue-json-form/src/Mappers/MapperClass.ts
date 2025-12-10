/**
 * These abstract classes define the contract for "mappers" that can transform
 * a field's JSON Schema and/or its UI schema `Control` based on static
 * information (no runtime data) or on the current form data.
 */
import type {
    Control,
    JSONSchema,
    Layout,
    Wizard,
} from '@educorvi/vue-json-form-schemas';

/**
 * Base class for mappers that do not depend on runtime form data.
 *
 * Contract notes:
 * - Implementations must be side-effect free.
 * - They must not mutate the input objects.
 */
export abstract class MapperWithoutData {
    /**
     * Transform a field's JSON Schema and/or its UI schema.
     *
     * @param jsonElement - The JSON Schema fragment describing the current field.
     * @param uiElement - The corresponding UI schema for the field.
     * @returns the mapped pair.
     */
    abstract map(
        jsonElement: JSONSchema,
        uiElement: Control
    ): null | {
        jsonElement: JSONSchema;
        uiElement: Control;
    };
}

/**
 * Base class for mappers that depend on runtime form data and/or need access to
 * the full JSON Schema/UI Schema context of the current field.
 *
 * Lifecycle:
 * 1) `registerSchemata(...)` is called before `map(...)` so the mapper can cache
 *    relevant schema context and compute dependencies.
 * 2) `map(...)` may be called repeatedly with different `data` snapshots.
 *
 * Protected context fields:
 * - `jsonSchema`: The full JSON Schema root object (read-only reference).
 * - `uiSchema`: The full UI schema layout (read-only reference).
 * - `scope`: Json-pointer-like path of the current field (e.g. `/properties/x`).
 * - `savePath`: Data addressing base used to build keys into the `data` map.
 */
export abstract class MapperWithData {
    protected jsonSchema: Readonly<JSONSchema> | undefined;
    protected uiSchema: Readonly<Layout | Wizard> | undefined;
    protected savePath: string | undefined;
    protected scope: string | undefined;
    protected jsonElement: JSONSchema | undefined;
    protected uiElement: Control | undefined;

    /**
     * Provide schema context for the mapper.
     * Called once per field before `map`.
     *
     * Implementations typically parse parent/related schema fragments here and
     * compute dependency paths for `getDependencies()`.
     *
     * @param jsonSchema - Root JSON Schema (read-only).
     * @param uiSchema - Root UI schema layout (read-only).
     * @param scope - Json-pointer-like path to the current field.
     * @param savePath - Data addressing base for the current field/siblings.
     * @param jsonElement - The JSON Schema fragment describing the current field.
     * @param uiElement - The corresponding UI schema for the field.
     */
    registerSchemata(
        jsonSchema: Readonly<JSONSchema>,
        uiSchema: Readonly<Layout | Wizard>,
        scope: string,
        savePath: string,
        jsonElement: JSONSchema,
        uiElement: Control
    ): void {
        this.jsonSchema = jsonSchema;
        this.uiSchema = uiSchema;
        this.scope = scope;
        this.savePath = savePath;
        this.jsonElement = jsonElement;
        this.uiElement = uiElement;
    }

    /**
     * Transform the current field's JSON Schema/UI control using the latest data.
     *
     * Implementations should avoid unnecessary object churn and only return
     * updated objects when something actually changed.
     *
     * @param jsonElement - Current field's JSON Schema fragment.
     * @param uiElement - Current field's UI schema control.
     * @param data - Flat map of json-pointer-like keys to values.
     * @returns `null` if the mapper does not apply; otherwise the resulting pair.
     */
    abstract map(
        jsonElement: JSONSchema,
        uiElement: Control,
        data: Readonly<Record<string, any>>
    ): Promise<null | {
        jsonElement: JSONSchema;
        uiElement: Control;
    }>;

    /**
     * Declare data keys this mapper depends on to recompute its result.
     *
     * Keys must be the same as used in `formData`.
     */
    abstract getDependencies(): string[];
}

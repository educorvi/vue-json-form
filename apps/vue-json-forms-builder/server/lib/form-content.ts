/**
 * Server-side helpers to convert between the stored yjs document state and
 * the derived artifacts (FormDefinition, json schema, ui schema).
 *
 * The yjs state stored in the database is the SINGLE SOURCE OF TRUTH.
 * Everything else (FormDefinition, json/ui schema artifacts) is derived from
 * it on demand — never stored separately.
 */
import * as Y from 'yjs';
import {
    FormDefinition,
    fromJsonSchemaAndUiSchema,
    SchemaGenerator,
} from '@educorvi/vue-json-forms-builder-schemas';
import {
    formDefinitionToYDoc,
    yDocToFormDefinition,
} from '@educorvi/vue-json-forms-builder-schemas/collab';

export interface FormArtifacts {
    json: Record<string, unknown> | null;
    ui: Record<string, unknown> | null;
}

export interface FormContent {
    /** FormDefinition.toJSON() output (root/elements/dependencies). */
    definition: Record<string, unknown> | null;
}

export type JsonSchemaPayload = Parameters<typeof fromJsonSchemaAndUiSchema>[0];

/**
 * Encode a FormDefinition into a yjs update (the persisted representation).
 */
export function definitionToYjsState(definition: FormDefinition): Buffer {
    const doc = formDefinitionToYDoc(definition);
    const update = Y.encodeStateAsUpdate(doc);
    doc.destroy();
    return Buffer.from(update);
}

/**
 * Decode a persisted yjs update into a FormDefinition.
 * Returns null when the state is empty/missing or not a form document.
 */
export function yjsStateToFormDefinition(
    state: Buffer | null | undefined
): FormDefinition | null {
    if (!state || state.length === 0) return null;
    const doc = new Y.Doc();
    try {
        Y.applyUpdate(doc, state);
        return yDocToFormDefinition(doc);
    } catch {
        return null;
    } finally {
        doc.destroy();
    }
}

/**
 * Decode a persisted yjs update into the exported artifacts
 * (json schema + ui schema).
 */
export function yjsStateToArtifacts(
    state: Buffer | null | undefined
): FormArtifacts | null {
    const definition = yjsStateToFormDefinition(state);
    if (!definition) return null;
    const generator = new SchemaGenerator(definition);
    return {
        json: definition.root.toJsonSchema(generator, ['properties']),
        ui: definition.root.toUiSchema(generator),
    };
}

/**
 * Convert provided artifacts (json/ui schema) into a persisted yjs state.
 * When only one side is provided, the other side is taken from the current
 * state if available. Returns null when no artifacts could be derived.
 */
export function artifactsToYjsState(
    artifacts: Partial<FormArtifacts>,
    currentState: Buffer | null | undefined
): Buffer | null {
    const current = currentState ? yjsStateToArtifacts(currentState) : null;
    const json = artifacts.json ?? current?.json ?? null;
    const ui = artifacts.ui ?? current?.ui ?? null;
    if (!json && !ui) return null;
    // A ui schema without a `layout` is invalid for reconstruction —
    // normalize it to an empty layout so legacy payloads (e.g. `ui: {}`)
    // don't crash the importer.
    const uiSafe =
        ui && (ui as { layout?: unknown }).layout
            ? ui
            : {
                  version:
                      (ui as { version?: string } | null)?.version ?? '2.2',
                  layout: { type: 'VerticalLayout', elements: [] },
              };
    // Rebuild the element tree from the exported {json, ui} pair.
    const definition = fromJsonSchemaAndUiSchema(
        (json ?? {}) as JsonSchemaPayload,
        uiSafe as Parameters<typeof fromJsonSchemaAndUiSchema>[1]
    ) as FormDefinition;
    return definitionToYjsState(definition);
}

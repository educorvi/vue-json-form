import { watch } from 'vue';
import type { FormBuilder } from '../useFormBuilder';

type DefinitionEmits = {
    (e: 'vjfb-change', jsonSchema: object, uiSchema: object): void;
    (e: 'vjfb-definition-change', definition: object): void;
};

/**
 * Emit the derived schemas/definition on every form change (debounced).
 * In collab mode the initial empty synced document must not overwrite the
 * legacy schema — emit only once the document actually has content.
 * Returns a cleanup function for the debounce timer.
 */
export function useDefinitionEmit(
    builder: FormBuilder,
    emit: DefinitionEmits
): () => void {
    let emitTimer: ReturnType<typeof setTimeout> | undefined;
    let collabHasContent = false;

    watch(
        () => builder.formDefinition.value,
        () => {
            if (emitTimer) clearTimeout(emitTimer);
            emitTimer = setTimeout(() => {
                const schemas = builder.generateSchemas();
                if (!schemas) return;
                if (builder.isCollab && !collabHasContent) {
                    const def = builder.toJSON() as {
                        root?: { children?: unknown[] };
                        elements?: Record<string, unknown>;
                    } | null;
                    const hasContent =
                        !!def &&
                        ((def.root?.children?.length ?? 0) > 0 ||
                            Object.keys(def.elements ?? {}).length > 0);
                    if (!hasContent) return;
                    collabHasContent = true;
                }
                emit('vjfb-change', schemas.jsonSchema, schemas.uiSchema);
                const definition = builder.toJSON();
                if (definition) emit('vjfb-definition-change', definition);
            }, 300);
        },
        { immediate: true }
    );

    return () => {
        if (emitTimer) clearTimeout(emitTimer);
    };
}

/**
 * useImportState.ts
 *
 * Composable that owns all state and logic for the Import dialog.
 * No Vue component knowledge here — pure reactive logic, fully unit-testable.
 *
 * Usage:
 *   // ImportDialog (root of the subtree) creates and provides the instance:
 *   const importState = useImportState(store, toast);
 *   provide(IMPORT_STATE_KEY, importState);
 *
 *   // Child components just inject it:
 *   const state = inject(IMPORT_STATE_KEY)!;
 */

import {
    computed,
    ref,
    watch,
    type InjectionKey,
    type Ref,
    type ComputedRef,
} from 'vue';
import type { JSONSchema, UISchema } from '@/types/formTypes';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ImportStateActions {
    doImport(): Promise<void>;
    reset(): void;
}

export interface ImportStateRefs {
    activeTab: Ref<number>;
    importing: Ref<boolean>;
    canImport: ComputedRef<boolean>;

    // Paste tab
    jsonText: Ref<string>;
    uiText: Ref<string>;
    jsonTextError: ComputedRef<string | null>;
    uiTextError: ComputedRef<string | null>;

    // Upload tab
    jsonFile: Ref<File | null>;
    uiFile: Ref<File | null>;
    jsonFileError: Ref<string | null>;
    uiFileError: Ref<string | null>;
}

export type ImportState = ImportStateRefs & ImportStateActions;

/** Injection key used to provide/inject the state within the dialog subtree. */
export const IMPORT_STATE_KEY: InjectionKey<ImportState> =
    Symbol('importState');

// ─── Pure helpers (exported for unit tests) ───────────────────────────────────

/** Validates a string as JSON. Returns an error message or null. */
export function validateJsonText(text: string): string | null {
    if (!text.trim()) return null; // empty: defer "Required" to submit time
    try {
        JSON.parse(text);
        return null;
    } catch (e: any) {
        return e.message as string;
    }
}

/** Parses a string as JSON for submission. Returns parsed value or throws. */
export function parseJsonOrThrow(text: string, label: string): unknown {
    if (!text.trim()) throw new Error(`${label} is required`);
    try {
        return JSON.parse(text);
    } catch (e: any) {
        throw new Error(`${label}: ${e.message}`);
    }
}

/** Reads a File as text and parses it as JSON. */
export function readJsonFile(file: File): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                resolve(JSON.parse(e.target!.result as string));
            } catch (err: any) {
                reject(
                    new Error(`Invalid JSON in "${file.name}": ${err.message}`)
                );
            }
        };
        reader.onerror = () =>
            reject(new Error(`Could not read "${file.name}"`));
        reader.readAsText(file);
    });
}

// ─── Composable ───────────────────────────────────────────────────────────────

export interface ImportDeps {
    loadSchemas: (json: JSONSchema, ui: UISchema) => void;
    onSuccess: () => void;
    onError: (message: string, error?: unknown) => void;
}

export function useImportState(deps: ImportDeps): ImportState {
    const activeTab = ref(0);
    const importing = ref(false);

    // Paste tab
    const jsonText = ref('');
    const uiText = ref('');
    const jsonTextError = computed(() => validateJsonText(jsonText.value));
    const uiTextError = computed(() => validateJsonText(uiText.value));

    // Upload tab
    const jsonFile = ref<File | null>(null);
    const uiFile = ref<File | null>(null);
    const jsonFileError = ref<string | null>(null);
    const uiFileError = ref<string | null>(null);

    // Clear file errors when a new file is selected
    watch(jsonFile, () => {
        jsonFileError.value = null;
    });
    watch(uiFile, () => {
        uiFileError.value = null;
    });

    const canImport = computed(() => {
        if (activeTab.value === 0) {
            return (
                jsonText.value.trim().length > 0 &&
                uiText.value.trim().length > 0 &&
                jsonTextError.value === null &&
                uiTextError.value === null
            );
        }
        return jsonFile.value !== null && uiFile.value !== null;
    });

    async function doImport(): Promise<void> {
        importing.value = true;
        try {
            let json: JSONSchema;
            let ui: UISchema;

            if (activeTab.value === 0) {
                // Paste mode — parse both texts; errors are already shown inline
                json = parseJsonOrThrow(
                    jsonText.value,
                    'JSON Schema'
                ) as JSONSchema;
                ui = parseJsonOrThrow(uiText.value, 'UI Schema') as UISchema;
            } else {
                // File mode — validate presence then read
                if (!jsonFile.value) {
                    jsonFileError.value = 'Please select a JSON Schema file';
                    return;
                }
                if (!uiFile.value) {
                    uiFileError.value = 'Please select a UI Schema file';
                    return;
                }
                try {
                    json = (await readJsonFile(jsonFile.value)) as JSONSchema;
                } catch (e: any) {
                    jsonFileError.value = e.message;
                    return;
                }
                try {
                    ui = (await readJsonFile(uiFile.value)) as UISchema;
                } catch (e: any) {
                    uiFileError.value = e.message;
                    return;
                }
            }

            deps.loadSchemas(json, ui);
            deps.onSuccess();
            reset();
        } catch (e: any) {
            deps.onError(e.message, e);
        } finally {
            importing.value = false;
        }
    }

    function reset(): void {
        jsonText.value = '';
        uiText.value = '';
        jsonFile.value = null;
        uiFile.value = null;
        jsonFileError.value = null;
        uiFileError.value = null;
        activeTab.value = 0;
    }

    return {
        activeTab,
        importing,
        canImport,
        jsonText,
        uiText,
        jsonTextError,
        uiTextError,
        jsonFile,
        uiFile,
        jsonFileError,
        uiFileError,
        doImport,
        reset,
    };
}

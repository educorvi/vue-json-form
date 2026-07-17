import { defineStore, type StoreDefinition } from 'pinia';
import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type {
    FormElement,
    LayoutElement,
    ControlElement,
    JSONSchema,
    UISchema,
    DisplayMode,
    ThemeMode,
    WizardElement,
    ObjectElement,
    ArrayElement,
} from '@/types/formTypes';
import { wrapElement, nodeFromUiSchema } from '@/types/elements/index';
import {
    buildFieldTree,
    type ControlFieldNode,
} from '@/types/elements/controlFields';
import { WizardNode } from '@/types/elements/nodes/WizardNode';
import {
    type SchemaContext,
    controlKey,
    resolveContext,
    getSchema,
    isRequired as schemaIsRequired,
    setRequired as schemaSetRequired,
    updateSchema,
    removeSchema,
    renameKey as schemaRenameKey,
    migrateToContainer,
    migrateToRoot,
    removeAllControlSchemas,
} from '@/types/elements/schemaResolver';
import { supportedUiSchemaVersion } from '@educorvi/vue-json-form';

function generateId(): string {
    return uuidv4();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the mutable children array for any container element, or null for
 * leaves. Delegates to EditorNode.children so ButtonGroup's `buttons` array
 * is also traversed — no special-cases needed here or in callers.
 */
function getChildElements(el: FormElement): FormElement[] | null {
    return wrapElement(el).children;
}

function findElementById(
    elements: FormElement[],
    id: string
): FormElement | null {
    for (const el of elements) {
        if (el._id === id) return el;
        const children = getChildElements(el);
        if (children) {
            const found = findElementById(children, id);
            if (found) return found;
        }
    }
    return null;
}

function findParentElements(
    elements: FormElement[],
    id: string
): FormElement[] | null {
    for (const el of elements) {
        const children = getChildElements(el);
        if (children) {
            if (children.some((c) => c._id === id)) return children;
            const found = findParentElements(children, id);
            if (found) return found;
        }
    }
    return null;
}

function removeElementById(elements: FormElement[], id: string): boolean {
    const idx = elements.findIndex((e) => e._id === id);
    if (idx !== -1) {
        elements.splice(idx, 1);
        return true;
    }
    for (const el of elements) {
        const children = getChildElements(el);
        if (children && removeElementById(children, id)) return true;
    }
    return false;
}

// Schema context lookup is handled by @/types/elements/schemaResolver

// ─── Store ────────────────────────────────────────────────────────────────────

export interface FormStore {
    rootLayout: Ref<LayoutElement | WizardElement>;
    jsonSchema: Ref<JSONSchema>;
    selectedElementId: Ref<string | null>;
    selectedElement: ComputedRef<FormElement | null>;
    displayMode: Ref<DisplayMode>;
    themeMode: Ref<ThemeMode>;
    isPreviewInline: Ref<boolean>;
    isExportOpen: Ref<boolean>;
    isImportOpen: Ref<boolean>;
    dragSourceType: Ref<string | null>;
    dragOverAncestorIds: Ref<string[]>;
    draggedElementId: Ref<string | null>;
    isDragOverTrash: Ref<boolean>;
    activeWizardPageIndex: Ref<number>;
    uiSchema: ComputedRef<UISchema>;
    exportedJsonSchema: ComputedRef<JSONSchema>;
    controlFields: ComputedRef<ControlFieldNode[]>;
    formIsEmpty: ComputedRef<boolean>;
    selectElement: (id: string | null) => void;
    addElementToRoot: (element: FormElement, index?: number) => void;
    removeElement: (id: string) => void;
    updateElement: (id: string, updates: Partial<FormElement>) => void;
    duplicateElement: (id: string) => void;
    addJsonSchemaProperty: (key: string, property: JSONSchema) => void;
    removeJsonSchemaProperty: (key: string) => void;
    getControlSchemaProperty: (controlId: string) => JSONSchema;
    updateControlSchemaProperty: (
        controlId: string,
        updates: Partial<JSONSchema>
    ) => void;
    isControlRequired: (controlId: string) => boolean;
    setControlRequired: (controlId: string, required: boolean) => void;
    migrateSchemaToParent: (schemaKey: string, parentId: string) => void;
    migrateSchemaToRoot: (schemaKey: string, fromParentId: string) => void;
    renameControlKey: (
        controlId: string,
        oldKey: string,
        newKey: string
    ) => void;
    setThemeMode: (mode: ThemeMode) => void;
    togglePreviewInline: () => void;
    openExport: () => void;
    closeExport: () => void;
    openImport: () => void;
    closeImport: () => void;
    setDragSource: (type: string | null) => void;
    setDragOverAncestorIds: (ids: string[]) => void;
    setDraggedElement: (id: string | null) => void;
    setRootToWizard: () => void;
    setRootToLayout: (
        type?: 'VerticalLayout' | 'HorizontalLayout' | 'Group'
    ) => void;
    addWizardPage: () => void;
    removeWizardPage: (index: number) => void;
    reorderWizardPage: (fromIndex: number, toIndex: number) => void;
    renameWizardPage: (index: number, label: string) => void;
    clearForm: () => void;
    loadSchemas: (json: JSONSchema, ui: UISchema) => void;
    generateId: () => string;
}

function setupFormStore(): FormStore {
    // ── State ──────────────────────────────────────────────────────────────────

    const rootLayout = ref<LayoutElement | WizardElement>({
        type: 'VerticalLayout',
        elements: [],
        _id: generateId(),
    } as LayoutElement);

    const jsonSchema = ref<JSONSchema>({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        title: 'My Form',
        properties: {},
        required: [],
    });

    const selectedElementId = ref<string | null>(null);
    const displayMode = ref<DisplayMode>('web');
    const themeMode = ref<ThemeMode>('light');
    const isPreviewInline = ref(false);
    const isExportOpen = ref(false);
    const isImportOpen = ref(false);
    const dragSourceType = ref<string | null>(null);
    const dragOverAncestorIds = ref<string[]>([]);
    const draggedElementId = ref<string | null>(null);
    const isDragOverTrash = ref(false);
    const activeWizardPageIndex = ref(0);

    // ── Root-aware helpers ─────────────────────────────────────────────────────

    /** All FormElements in root (flattened pages for Wizard). For read searches. */
    function getAllRootElements(): FormElement[] {
        const root = rootLayout.value;
        if (root.type === 'Wizard')
            return (root as WizardElement).pages.flatMap((p) => p.elements);
        return (root as LayoutElement).elements;
    }

    /** The active container list to append newly-added palette elements to. */
    function getActivePage(): FormElement[] {
        const root = rootLayout.value;
        if (root.type === 'Wizard') {
            const wiz = root as WizardElement;
            const idx = Math.max(
                0,
                Math.min(activeWizardPageIndex.value, wiz.pages.length - 1)
            );
            return wiz.pages[idx]?.elements ?? [];
        }
        return (root as LayoutElement).elements;
    }

    /** Remove an element by id from across all Wizard pages or the Layout. */
    function removeFromRoot(id: string): boolean {
        const root = rootLayout.value;
        if (root.type === 'Wizard') {
            for (const page of (root as WizardElement).pages) {
                if (removeElementById(page.elements, id)) return true;
            }
            return false;
        }
        return removeElementById((root as LayoutElement).elements, id);
    }

    /** Reactive parent array of an element — safe to mutate. */
    function getRootParentList(id: string): FormElement[] {
        const root = rootLayout.value;
        if (root.type === 'Wizard') {
            for (const page of (root as WizardElement).pages) {
                if (page.elements.some((e) => e._id === id))
                    return page.elements;
                const found = findParentElements(page.elements, id);
                if (found) return found;
            }
            return getActivePage();
        }
        const elements = (root as LayoutElement).elements;
        return findParentElements(elements, id) ?? elements;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    const selectedElement = computed<FormElement | null>(() => {
        if (!selectedElementId.value) return null;
        const found = findElementById(
            getAllRootElements(),
            selectedElementId.value
        );
        if (found) return found;
        if (rootLayout.value._id === selectedElementId.value)
            return rootLayout.value as FormElement;
        return null;
    });

    const uiSchema = computed<UISchema>(() => ({
        version: supportedUiSchemaVersion,
        layout: wrapElement(rootLayout.value as FormElement).toUiSchema() as
            LayoutElement | WizardElement,
    }));

    /** Hierarchical list of all addressable fields in the form (for field-path pickers). */
    const controlFields = computed<ControlFieldNode[]>(() =>
        buildFieldTree(rootLayout.value as FormElement, jsonSchema.value)
    );

    const exportedJsonSchema = computed<JSONSchema>(() => {
        // Start with an empty properties map — ControlNode.collectSchemas reads
        // from rootProps and self-populates, so the export is correct regardless
        // of whether schema migration events fired.
        const rootProps =
            (jsonSchema.value.properties as Record<string, JSONSchema>) ?? {};
        const props: Record<string, JSONSchema> = {};
        wrapElement(rootLayout.value as FormElement).collectSchemas(
            props,
            rootProps
        );
        return { ...jsonSchema.value, properties: props };
    });

    const exportedJsonSchemaIsEmpty = computed<boolean>(() => {
        return (
            Object.keys((exportedJsonSchema.value.properties as object) ?? {})
                .length === 0
        );
    });

    const formIsEmpty = computed<boolean>(() => {
        let uiSchemaEmpty: boolean = false;
        if (rootLayout.value.type === 'Wizard') {
            uiSchemaEmpty = (rootLayout.value as WizardElement).pages.every(
                (p) => p.elements.length === 0
            );
        } else {
            uiSchemaEmpty =
                (rootLayout.value as LayoutElement).elements.length === 0;
        }
        return uiSchemaEmpty && exportedJsonSchemaIsEmpty.value;
    });

    // ── Schema context helpers (delegated to schemaResolver) ──────────────────

    function _getCtx(controlId: string): SchemaContext {
        return resolveContext(
            controlId,
            getAllRootElements(),
            jsonSchema.value
        );
    }

    function getControlSchemaProperty(controlId: string): JSONSchema {
        const el = findElementById(getAllRootElements(), controlId);
        if (!el || el.type !== 'Control') return { type: 'string' };
        return getSchema(el as ControlElement, _getCtx(controlId));
    }

    function updateControlSchemaProperty(
        controlId: string,
        updates: Partial<JSONSchema>
    ): void {
        const el = findElementById(getAllRootElements(), controlId);
        if (!el || el.type !== 'Control') return;
        updateSchema(el as ControlElement, _getCtx(controlId), updates);
    }

    function isControlRequired(controlId: string): boolean {
        const el = findElementById(getAllRootElements(), controlId);
        if (!el || el.type !== 'Control') return false;
        return schemaIsRequired(el as ControlElement, _getCtx(controlId));
    }

    function setControlRequired(controlId: string, required: boolean): void {
        const el = findElementById(getAllRootElements(), controlId);
        if (!el || el.type !== 'Control') return;
        schemaSetRequired(
            el as ControlElement,
            _getCtx(controlId),
            required,
            jsonSchema.value
        );
    }

    function migrateSchemaToParent(schemaKey: string, parentId: string): void {
        const parentEl = findElementById(getAllRootElements(), parentId);
        if (!parentEl) return;
        if (parentEl.type === 'Object' || parentEl.type === 'Array') {
            migrateToContainer(
                schemaKey,
                jsonSchema.value,
                parentEl as ObjectElement | ArrayElement,
                getAllRootElements()
            );
        }
    }

    function migrateSchemaToRoot(
        schemaKey: string,
        fromParentId: string
    ): void {
        const parentEl = findElementById(getAllRootElements(), fromParentId);
        if (!parentEl) return;
        if (parentEl.type === 'Object' || parentEl.type === 'Array') {
            migrateToRoot(
                schemaKey,
                parentEl as ObjectElement | ArrayElement,
                jsonSchema.value
            );
        }
    }

    function renameControlKey(
        controlId: string,
        oldKey: string,
        newKey: string
    ): void {
        if (!newKey || newKey === oldKey) return;
        const el = findElementById(getAllRootElements(), controlId);
        if (!el || el.type !== 'Control') return;
        const newScope = schemaRenameKey(
            el as ControlElement,
            _getCtx(controlId),
            newKey,
            jsonSchema.value
        );
        updateElement(controlId, {
            scope: newScope,
        } as Partial<ControlElement>);
    }

    // ── Actions ────────────────────────────────────────────────────────────────

    function selectElement(id: string | null): void {
        selectedElementId.value = id;
    }

    function addElementToRoot(element: FormElement, index?: number): void {
        const list = getActivePage();
        if (index === undefined) {
            list.push(element);
        } else {
            list.splice(index, 0, element);
        }
    }

    function removeElement(id: string): void {
        if (selectedElementId.value === id) selectedElementId.value = null;
        const el = findElementById(getAllRootElements(), id);
        if (el?.type === 'Control') {
            removeSchema(el as ControlElement, _getCtx(id));
        }
        removeFromRoot(id);
    }

    function updateElement(id: string, updates: Partial<FormElement>): void {
        const el =
            id === rootLayout.value._id
                ? (rootLayout.value as FormElement)
                : findElementById(getAllRootElements(), id);
        if (!el) return;
        Object.assign(el, updates);
    }

    function duplicateElement(id: string): void {
        const el = findElementById(getAllRootElements(), id);
        if (!el) return;
        const cloned = JSON.parse(JSON.stringify(el));
        const reassignIds = (element: FormElement) => {
            element._id = generateId();
            const children = getChildElements(element);
            if (children) children.forEach(reassignIds);
        };
        reassignIds(cloned);
        const parentList = getRootParentList(id);
        const idx = parentList.findIndex((e) => e._id === id);
        if (idx !== -1) parentList.splice(idx + 1, 0, cloned);
        selectElement(cloned._id);
    }

    // Legacy helpers for root-level schema (still used by palette cloneItem)
    function addJsonSchemaProperty(key: string, property: JSONSchema): void {
        if (!jsonSchema.value.properties) jsonSchema.value.properties = {};
        (jsonSchema.value.properties as Record<string, JSONSchema>)[key] =
            property;
    }

    function removeJsonSchemaProperty(key: string): void {
        if (jsonSchema.value.properties)
            delete (jsonSchema.value.properties as Record<string, JSONSchema>)[
                key
            ];
    }

    function setThemeMode(mode: ThemeMode): void {
        themeMode.value = mode;
        if (mode === 'dark') {
            document.documentElement.classList.add('my-app-dark');
        } else {
            document.documentElement.classList.remove('my-app-dark');
        }
    }

    function togglePreviewInline(): void {
        isPreviewInline.value = !isPreviewInline.value;
    }

    function openExport(): void {
        isExportOpen.value = true;
    }

    function closeExport(): void {
        isExportOpen.value = false;
    }

    function openImport(): void {
        isImportOpen.value = true;
    }

    function closeImport(): void {
        isImportOpen.value = false;
    }

    function setDragSource(type: string | null): void {
        dragSourceType.value = type;
    }

    function setDragOverAncestorIds(ids: string[]): void {
        dragOverAncestorIds.value = ids;
    }

    function setDraggedElement(id: string | null): void {
        draggedElementId.value = id;
    }

    function setDragOverTrash(over: boolean): void {
        isDragOverTrash.value = over;
    }

    /**
     * Convert root to Wizard (clears current content).
     * Caller is responsible for confirming data loss.
     */
    function setRootToWizard(): void {
        // Clean up JSON schema entries for all controls being removed
        removeAllControlSchemas(getAllRootElements(), jsonSchema.value);
        rootLayout.value = {
            type: 'Wizard',
            pages: [
                {
                    type: 'VerticalLayout',
                    elements: [],
                    options: { label: 'Page 1' },
                    _id: generateId(),
                },
            ],
            _id: rootLayout.value._id,
        } as unknown as WizardElement;
        activeWizardPageIndex.value = 0;
        selectedElementId.value = null;
    }

    /**
     * Convert root back to a flat Layout (clears current content).
     * Caller is responsible for confirming data loss.
     */
    function setRootToLayout(
        type: 'VerticalLayout' | 'HorizontalLayout' | 'Group' = 'VerticalLayout'
    ): void {
        // Clean up JSON schema entries for all controls being removed
        removeAllControlSchemas(getAllRootElements(), jsonSchema.value);
        rootLayout.value = {
            type,
            elements: [],
            _id: rootLayout.value._id,
        } as LayoutElement;
        activeWizardPageIndex.value = 0;
        selectedElementId.value = null;
    }

    function addWizardPage(): void {
        if (rootLayout.value.type !== 'Wizard') return;
        const wiz = rootLayout.value as unknown as WizardElement;
        const pageNum = wiz.pages.length + 1;
        wiz.pages.push({
            type: 'VerticalLayout',
            elements: [],
            options: { label: `Page ${pageNum}` },
            _id: generateId(),
        });
        activeWizardPageIndex.value = wiz.pages.length - 1;
    }

    function removeWizardPage(index: number): void {
        if (rootLayout.value.type !== 'Wizard') return;
        const wiz = rootLayout.value as unknown as WizardElement;
        if (wiz.pages.length <= 1) return;
        // Clean up schemas for controls on the page being removed
        removeAllControlSchemas(wiz.pages[index].elements, jsonSchema.value);
        wiz.pages.splice(index, 1);
        activeWizardPageIndex.value = Math.min(
            activeWizardPageIndex.value,
            wiz.pages.length - 1
        );
    }

    function reorderWizardPage(fromIndex: number, toIndex: number): void {
        if (rootLayout.value.type !== 'Wizard') return;
        const wiz = rootLayout.value as unknown as WizardElement;
        if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= wiz.pages.length ||
            toIndex >= wiz.pages.length ||
            fromIndex === toIndex
        )
            return;
        const [page] = wiz.pages.splice(fromIndex, 1);
        wiz.pages.splice(toIndex, 0, page);
        // Keep active page tracking the moved page
        if (activeWizardPageIndex.value === fromIndex) {
            activeWizardPageIndex.value = toIndex;
        } else if (
            fromIndex < toIndex &&
            activeWizardPageIndex.value > fromIndex &&
            activeWizardPageIndex.value <= toIndex
        ) {
            activeWizardPageIndex.value -= 1;
        } else if (
            fromIndex > toIndex &&
            activeWizardPageIndex.value >= toIndex &&
            activeWizardPageIndex.value < fromIndex
        ) {
            activeWizardPageIndex.value += 1;
        }
    }

    function renameWizardPage(index: number, label: string): void {
        if (rootLayout.value.type !== 'Wizard') return;
        const wiz = rootLayout.value as unknown as WizardElement;
        const page = wiz.pages[index];
        if (!page) return;
        page.options = {
            ...(page.options as object | undefined),
            label: label.trim() || `Page ${index + 1}`,
        };
    }

    function clearForm(): void {
        rootLayout.value = {
            type: 'VerticalLayout',
            elements: [],
            _id: generateId(),
        } as LayoutElement;
        jsonSchema.value = {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
            title: 'My Form',
            properties: {},
            required: [],
        };
        selectedElementId.value = null;
        isPreviewInline.value = false;
    }

    function loadSchemas(json: JSONSchema, ui: UISchema): void {
        jsonSchema.value = json;
        const layout = ui.layout as any;
        if (layout.type === 'Wizard') {
            rootLayout.value = WizardNode.fromUiSchema(
                layout,
                json
            ) as unknown as WizardElement;
        } else {
            const node = nodeFromUiSchema(layout, json);
            rootLayout.value = {
                ...node,
                _id: (node as any)._id ?? generateId(),
            } as LayoutElement;
        }
        selectedElementId.value = null;
        activeWizardPageIndex.value = 0;
    }

    return {
        rootLayout,
        jsonSchema,
        selectedElementId,
        selectedElement,
        displayMode,
        themeMode,
        isPreviewInline,
        isExportOpen,
        isImportOpen,
        dragSourceType,
        dragOverAncestorIds,
        draggedElementId,
        isDragOverTrash,
        activeWizardPageIndex,
        uiSchema,
        exportedJsonSchema,
        controlFields,
        formIsEmpty,
        selectElement,
        addElementToRoot,
        removeElement,
        updateElement,
        duplicateElement,
        addJsonSchemaProperty,
        removeJsonSchemaProperty,
        getControlSchemaProperty,
        updateControlSchemaProperty,
        isControlRequired,
        setControlRequired,
        migrateSchemaToParent,
        migrateSchemaToRoot,
        renameControlKey,
        setThemeMode,
        togglePreviewInline,
        setDragOverTrash,
        openExport,
        closeExport,
        openImport,
        closeImport,
        setDragSource,
        setDragOverAncestorIds,
        setDraggedElement,
        setRootToWizard,
        setRootToLayout,
        addWizardPage,
        removeWizardPage,
        reorderWizardPage,
        renameWizardPage,
        clearForm,
        loadSchemas,
        generateId,
    };
}

export const useFormStore = defineStore('form', setupFormStore, {
    persist: {
        pick: ['rootLayout', 'jsonSchema'],
    },
});

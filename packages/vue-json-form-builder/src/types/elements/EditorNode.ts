/**
 * EditorNode.ts
 *
 * Abstract base class for all editor node wrappers.
 *
 * Merges two previously separate concerns into a single contract per element type:
 *   - Presentation metadata: icon, isContainer, getLabel   (was: ElementMeta in formTypes.ts)
 *   - Editor behaviour: toUiSchema, dropZone, children     (was: EditorNode in elementModel.ts)
 *
 * Each FormElement type has exactly one subclass, defined in its own file under nodes/.
 * This eliminates the _meta registry object, NODE_REGISTRY, and FROM_SCHEMA_REGISTRY
 * — everything about a given element type lives in one place.
 */

import type {
    JSONSchema,
    LayoutElement as VJFLayoutElement,
} from '@educorvi/vue-json-form-schemas';
import type { FormElement } from '../formTypes';

/** Describes what a container drop zone accepts and how it lays out its children. */
export interface DropZoneConfig {
    /** Element `type` strings that may be dropped — `'*'` means any type. */
    allowedTypes: string[] | '*';
    /**
     * Visual layout of children inside the drop zone:
     * - `'vertical'`   — stacked (default for most layouts)
     * - `'horizontal'` — side-by-side (HorizontalLayout)
     * - `'flex-row'`   — row-wrapped (ButtonGroup)
     */
    layout: 'vertical' | 'horizontal' | 'flex-row';
    /** Human-readable hint shown when the drop zone is empty. */
    emptyLabel: string;
    /** Maximum number of children allowed. Undefined = unlimited. */
    maxChildren?: number;
}

export abstract class EditorNode {
    /** The plain FormElement data this node wraps (stored in Vue reactive state). */
    abstract readonly element: FormElement;

    // ─── Presentation (replaces ElementMeta) ─────────────────────────────────

    /** PrimeIcons class string for tree view / canvas header. */
    static readonly icon: string;

    /**
     * True when this element owns a list of child FormElements that the tree
     * view should expand. Note: having a dropZone does NOT imply isContainer=true
     * (e.g. ButtonGroup has a drop zone but is not expanded in the tree view).
     */
    static readonly isContainer: boolean;

    get icon(): typeof EditorNode.icon {
        return (this.constructor as typeof EditorNode).icon;
    }

    get isContainer(): typeof EditorNode.isContainer {
        return (this.constructor as typeof EditorNode).isContainer;
    }

    /**
     * Display label shown in tree view / canvas header.
     * Pass the root JSON schema so Control labels can resolve their schema title.
     */
    abstract getLabel(jsonSchema?: JSONSchema): string;

    // ─── Behaviour (replaces EditorNode) ─────────────────────────────────────

    /** Serialise to a VJF UI-schema element. Used for preview and export. */
    abstract toUiSchema(scopePrefix?: string): VJFLayoutElement;

    /** Drop zone config if this element accepts dropped children; null for leaf nodes. */
    get dropZone(): DropZoneConfig | null {
        return null;
    }

    /** Mutable children list; null for leaf nodes. */
    get children(): FormElement[] | null {
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    set children(_val: FormElement[] | null) {
        // container subclasses override this setter
    }

    /**
     * Collect this element's contribution to the JSON Schema export into `target`.
     *
     * Object/Array nodes emit their own schema entry and recurse.
     * Layout/Wizard nodes recurse without emitting their own entry.
     * ControlNode reads its schema from `rootProps` (the store's flat property map)
     *   so that the export is correct regardless of whether schema migration ran.
     * Leaf nodes (Button, Divider, HTML) are no-ops.
     *
     * @param target    Mutable properties map to write into.
     * @param rootProps The store's flat `jsonSchema.properties` map — passed through
     *                  so that ControlNode can look up its schema by scope key.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    collectSchemas(
        _target: Record<string, JSONSchema>,
        _rootProps?: Record<string, JSONSchema>
    ): void {}

    /**
     * If this element owns a JSON Schema properties map (i.e. Object or Array),
     * returns references to its mutable `props` and `required` arrays.
     * Used by `findSchemaCtx` in the store to resolve which map a Control belongs to.
     * Default: null (not a schema-owning container).
     */
    schemaContext(): {
        props: Record<string, JSONSchema>;
        required: string[];
    } | null {
        return null;
    }
}

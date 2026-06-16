import { v4 as uuidv4 } from 'uuid';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { EditorNode } from '../EditorNode';
import type { ControlElement } from '../../formTypes';
import { controlKey } from '../schemaResolver';

export class ControlNode extends EditorNode {
    static readonly icon = 'bi bi-pencil';
    static readonly isContainer = false;

    constructor(readonly element: ControlElement) {
        super();
    }

    getLabel(jsonSchema?: JSONSchema): string {
        const key = this.element.scope.split('/').pop() ?? this.element.scope;
        if (!jsonSchema?.properties) return key;
        const prop = (jsonSchema.properties as Record<string, JSONSchema>)[key];
        return prop && typeof prop === 'object'
            ? ((prop as { title?: string }).title ?? key)
            : key;
    }

    toUiSchema(scopePrefix = ''): Control {
        const { _id, ...rest } = this.element as any;
        return {
            ...rest,
            scope: scopePrefix ? `${scopePrefix}${rest.scope}` : rest.scope,
        } as Control;
    }

    /**
     * Contributes this control's schema to `target` by reading from `rootProps`.
     * This works whether or not schema migration has been called: if the schema
     * is still in `rootProps` (not migrated), it gets correctly placed into
     * whatever container `target` represents (array items, object props, or root).
     */
    override collectSchemas(
        target: Record<string, JSONSchema>,
        rootProps?: Record<string, JSONSchema>
    ): void {
        if (!rootProps) return;
        const key = controlKey(this.element.scope);
        const schema = rootProps[key];
        if (schema !== undefined) {
            target[key] = schema;
        }
    }

    static fromUiSchema(raw: Control): ControlElement {
        return { ...raw, _id: uuidv4() } as ControlElement;
    }
}

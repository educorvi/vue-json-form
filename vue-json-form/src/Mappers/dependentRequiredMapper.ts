import { MapperWithData } from '@/Mappers/MapperClass.ts';
import type {
    Control,
    JSONSchema,
    Layout,
    Wizard,
} from '@educorvi/vue-json-form-schemas';
import { sliceScope } from '@/Commons.ts';
import { getJsonPointerSafe } from '@/computedProperties/json.ts';

export class DependentRequiredMapper extends MapperWithData {
    private dependencies: string[] = [];
    getDependencies(): string[] {
        return this.dependencies;
    }

    registerSchemata(
        jsonSchema: Readonly<JSONSchema>,
        uiSchema: Readonly<Layout | Wizard>,
        scope: string,
        savePath: string,
        jsonElement: JSONSchema,
        uiElement: Control
    ) {
        super.registerSchemata(
            jsonSchema,
            uiSchema,
            scope,
            savePath,
            jsonElement,
            uiElement
        );
        const depReqScope = sliceScope(scope, -2) + '/dependentRequired';
        const depReq: Record<string, string[]> = getJsonPointerSafe(
            jsonSchema,
            depReqScope
        );
        if (!depReq) {
            return;
        }
        const deqReqsForThisField = Object.entries(depReq)
            .map(([key, reqs]) => ({
                key,
                requiresThis: reqs.includes(scope.split('/').pop() || ''),
            }))
            .filter(({ requiresThis }) => requiresThis)
            .map(({ key }) => key);
        this.dependencies = deqReqsForThisField.map(
            (key) => sliceScope(savePath, -1) + '/' + key
        );
    }

    async map(
        jsonElement: JSONSchema,
        uiElement: Control,
        data: Readonly<Record<string, any>>
    ): Promise<{
        jsonElement: JSONSchema;
        uiElement: Control;
    } | null> {
        let required = false;
        for (const dependency of this.dependencies) {
            if (data[dependency]) {
                required = true;
                break;
            }
        }
        if (required) {
            const newUiElement: Control = JSON.parse(JSON.stringify(uiElement));
            if (!newUiElement.options) {
                newUiElement.options = {};
            }
            newUiElement.options.forceRequired = true;
            return { jsonElement, uiElement: newUiElement };
        } else {
            return { jsonElement, uiElement };
        }
    }
}

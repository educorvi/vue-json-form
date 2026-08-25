import type { ShowOnProperty } from '@educorvi/vue-json-form-schemas';
import { SchemaGenerator } from './schema-generator';
import { Dependency, DependencyGroup } from './dependency';

/**
 * Resolves an element's dependencyGroup uid reference against the document's
 * dependency index and produces the `showOn` property of its UI schema.
 * Returns undefined when the element has no dependency group.
 */
export function createShowOnProperty(
    dependencyGroupId: string | undefined,
    generator: SchemaGenerator,
    scope: string[]
): ShowOnProperty | undefined {
    if (dependencyGroupId) {
        const depGroup =
            generator.document.getDependency_Group(dependencyGroupId);
        if (depGroup instanceof DependencyGroup) {
            const showOn = depGroup.toUiSchema(generator, scope);
            return showOn;
        } else if (depGroup instanceof Dependency) {
            throw new Error(
                `Dependency "${depGroup.id}" is not a DependencyGroup`
            );
        } else {
            throw new Error(`DependencyGroup "${dependencyGroupId}" not found`);
        }
    }
    return undefined;
}

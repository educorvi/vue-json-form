import { AppDataSource } from '@educorvi/vue-json-forms-builder-db-layer';
import { GroupService } from '~~/server/services/GroupService';

/**
 * Resolve a parent-group reference (numeric ID or path string) to a group ID.
 * Returns null if the reference is empty/falsy.
 */
export async function resolveParentGroupId(
    parentRef: string | undefined | null
): Promise<number | null> {
    if (!parentRef) return null;
    if (/^\d+$/.test(parentRef)) {
        return parseInt(parentRef, 10);
    }
    const groupService = new GroupService(AppDataSource);
    const group = await groupService.getByIdOrSlug(parentRef);
    return group.id;
}

import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';
import type { zGroupHierarchyNode } from '~~/server/orpc/generated/zod.gen';
import type z from 'zod';
import {
    TEST_GROUP,
    CHILD_GROUP,
    SECOND_CHILD_GROUP,
    ADDITIONAL_GROUP,
    createTestGroup,
    createChildGroup,
} from '../../../support/api/groups';

type HierarchyNode = z.infer<typeof zGroupHierarchyNode>;

// helpers

/**
 * Finds a node in a hierarchy tree by its id, recursively.
 */
function findNodeById(
    nodes: HierarchyNode[],
    id: number
): HierarchyNode | undefined {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return undefined;
}

// tests

describe('Group Hierarchy', () => {
    // Given an admin user exists (fresh per test)
    let admin: ProvisionedUser;

    beforeEach(async () => {
        admin = await provisionUser({ role: 'admin' });
    });

    // And the database is completely wiped again after each test
    afterEach(async () => {
        await resetTestDatabase();
    });

    describe('root groups', () => {
        it('returns an empty hierarchy when there are no groups', async () => {
            // When fetching the hierarchy with no groups
            const hierarchy = await admin.client.groups.hierarchy();

            // Then the hierarchy is empty
            expect(hierarchy).toHaveLength(0);
        });

        it('returns root groups as the top level of the hierarchy', async () => {
            // Given two root groups exist (with unique names)
            const groupA = await createTestGroup(admin);
            const groupB = await createTestGroup(admin, ADDITIONAL_GROUP);

            // When fetching the hierarchy
            const hierarchy = await admin.client.groups.hierarchy();

            // Then both root groups are at the top level
            expect(hierarchy.map((n: HierarchyNode) => n.id)).toEqual(
                expect.arrayContaining([groupA.id, groupB.id])
            );

            // And they carry their title and name
            const nodeA = hierarchy.find((n) => n.id === groupA.id);
            expect(nodeA?.title).toBe(TEST_GROUP.title);
            expect(nodeA?.name).toBe(TEST_GROUP.name);

            // And they have no children
            expect(nodeA?.children).toBeNull();
        });
    });

    describe('nested groups', () => {
        it('returns nested children within their parent group', async () => {
            // Given a root group with a nested child
            const parent = await createTestGroup(admin);
            const child = await createChildGroup(admin, parent.id);

            // When fetching the hierarchy
            const hierarchy = await admin.client.groups.hierarchy();

            // Then the parent contains the child as a nested node
            const parentNode = hierarchy.find((n) => n.id === parent.id);
            expect(parentNode).toBeDefined();
            expect(
                parentNode?.children?.map((n: HierarchyNode) => n.id)
            ).toEqual([child.id]);

            // And the child carries its own title/name and no grandchildren
            const childNode = parentNode?.children?.[0];
            expect(childNode?.title).toBe(CHILD_GROUP.title);
            expect(childNode?.name).toBe(CHILD_GROUP.name);
            expect(childNode?.children).toBeNull();
        });

        it('returns deeply nested groups as a multi-level tree', async () => {
            // Given a root group with a nested child that itself has a child
            const parent = await createTestGroup(admin);
            const child = await createChildGroup(admin, parent.id);
            const grandchild = await createChildGroup(admin, child.id);

            // When fetching the hierarchy
            const hierarchy = await admin.client.groups.hierarchy();

            // Then the tree is three levels deep: parent → child → grandchild
            const parentNode = hierarchy.find((n) => n.id === parent.id);
            expect(
                parentNode?.children?.map((n: HierarchyNode) => n.id)
            ).toEqual([child.id]);

            const childNode = parentNode?.children?.[0];
            expect(
                childNode?.children?.map((n: HierarchyNode) => n.id)
            ).toEqual([grandchild.id]);

            const grandchildNode = childNode?.children?.[0];
            expect(grandchildNode?.children).toBeNull();
        });

        it('keeps sibling groups separate within the same parent', async () => {
            // Given a parent group with two children (with unique names)
            const parent = await createTestGroup(admin);
            const childA = await createChildGroup(admin, parent.id);
            const childB = await createChildGroup(
                admin,
                parent.id,
                SECOND_CHILD_GROUP
            );

            // When fetching the hierarchy
            const hierarchy = await admin.client.groups.hierarchy();

            // Then both children appear under the same parent
            const parentNode = hierarchy.find((n) => n.id === parent.id);
            expect(
                parentNode?.children?.map((n: HierarchyNode) => n.id)
            ).toEqual(expect.arrayContaining([childA.id, childB.id]));
        });

        it('does not duplicate the child at the root level', async () => {
            // Given a root group with a nested child
            const parent = await createTestGroup(admin);
            const child = await createChildGroup(admin, parent.id);

            // When fetching the hierarchy
            const hierarchy = await admin.client.groups.hierarchy();

            // Then only the parent is at the root — the child is nested only
            expect(hierarchy.map((n: HierarchyNode) => n.id)).toEqual([
                parent.id,
            ]);
            expect(hierarchy.some((n) => n.id === child.id)).toBe(false);
        });

        it('returns a flat list of all group ids in the tree', async () => {
            // Given a multi-level hierarchy exists (unique names at each level)
            const parent = await createTestGroup(admin);
            const child = await createChildGroup(admin, parent.id);
            const grandchild = await createChildGroup(admin, child.id);
            const sibling = await createTestGroup(admin, ADDITIONAL_GROUP);

            // When fetching the hierarchy
            const hierarchy = await admin.client.groups.hierarchy();

            // Then every group is reachable in the tree (helper recursion)
            const allIds = [parent.id, child.id, grandchild.id, sibling.id];
            for (const id of allIds) {
                expect(findNodeById(hierarchy, id)).toBeDefined();
            }
        });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});

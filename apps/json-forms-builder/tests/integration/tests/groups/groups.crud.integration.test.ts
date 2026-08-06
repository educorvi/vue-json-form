import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource } from '../../../support/db/db';
import { ORPCError } from '@orpc/client';
import {
    expectApiCreatedAndUpdatedBy,
    expectApiUpdatedAfterCreated,
    expectApiCreatedBy,
    expectApiUpdatedBy,
} from '../../../support/api/resource-modifications';
import {
    expectDbCreatedAndUpdatedBy,
    expectDbUpdatedAfterCreated,
    expectDbCreatedBy,
    expectDbUpdatedBy,
} from '../../../support/db/resource-modifications';
import {
    TEST_GROUP,
    CHILD_GROUP,
    ADDITIONAL_GROUP,
    INVALID_GROUP_ID,
    createTestGroup,
    createChildGroup,
    listGroupsApi,
    getGroupApi,
    checkGroupMatchesApi,
    checkGroupIncludedInListApi,
} from '../../../support/api/groups';
import {
    findGroupRowById,
    checkGroupMatchesDb,
} from '../../../support/db/groups';

// tests

describe('Groups API', () => {
    // Given an admin user exists (fresh per test)
    let admin: ProvisionedUser;
    let user2: ProvisionedUser;

    beforeEach(async () => {
        admin = await provisionUser({ role: 'admin' });
        user2 = await provisionUser({ role: 'admin' });
    });

    // And the database is completely wiped again after each test
    afterEach(async () => {
        await resetTestDatabase();
    });

    describe('creating a root group', () => {
        it('creates a root group and returns it', async () => {
            // When creating a root group
            const group = await createTestGroup(admin);

            // Then the API returns the group with the submitted fields
            checkGroupMatchesApi(group, null);

            // And the modification info points at the creating admin
            expectApiCreatedAndUpdatedBy(group, admin);
            expectApiUpdatedAfterCreated(group);
        });

        it('persists a created root group in the database', async () => {
            // Given creating a root group
            const group = await createTestGroup(admin);

            // When looking the group up directly in the database
            const row = await findGroupRowById(group.id);

            // Then the row exists with matching data
            checkGroupMatchesDb(row, null);

            // And the modification info points at the creating admin
            expectDbCreatedAndUpdatedBy(row!, admin);
            expectDbUpdatedAfterCreated(row!);
        });
    });

    describe('creating a group inside a group', () => {
        it('creates a group inside a group and returns it', async () => {
            // Given a parent group exists
            const parent = await createTestGroup(admin);

            // When creating a group inside that parent
            const group = await createChildGroup(admin, parent.id);

            // Then the API returns the group with the submitted fields
            expect(group.title).toBe(CHILD_GROUP.title);
            expect(group.name).toBe(CHILD_GROUP.name);
            expect(group.parent_id ?? null).toBe(parent.id);

            // And the modification info points at the creating admin
            expectApiCreatedAndUpdatedBy(group, admin);
            expectApiUpdatedAfterCreated(group);
        });

        it('persists a created group in the database', async () => {
            // Given a parent group exists
            const parent = await createTestGroup(admin);
            const group = await createChildGroup(admin, parent.id);

            // When looking the group up directly in the database
            const row = await findGroupRowById(group.id);

            // Then the row exists with matching data
            expect(row).toBeDefined();
            expect(row?.title).toBe(CHILD_GROUP.title);
            expect(row?.name).toBe(CHILD_GROUP.name);
            expect(row?.parent_id ?? null).toBe(parent.id);

            // And the modification info points at the creating admin
            expectDbCreatedAndUpdatedBy(row!, admin);
            expectDbUpdatedAfterCreated(row!);
        });
    });

    describe('listing groups', () => {
        it('lists all groups', async () => {
            // Given a root group and a group inside a group exist
            const parent = await createTestGroup(admin);
            const child = await createChildGroup(admin, parent.id);

            // When listing all groups (no filter — root groups only)
            const { data } = await listGroupsApi(admin, '0');

            // Then the root group is included exactly once
            checkGroupIncludedInListApi(data, parent.id);

            // And the child group is not included (it lives under the parent)
            expect(data.some((g) => g.id === child.id)).toBe(false);
        });

        it('lists child groups of a specific parent only', async () => {
            // Given two root groups each containing a child group exist
            const parentA = await createTestGroup(admin);
            const parentB = await createTestGroup(admin, ADDITIONAL_GROUP);
            const childInA = await createChildGroup(admin, parentA.id);
            const childInB = await createChildGroup(admin, parentB.id);

            // When listing the children of one group
            const { data } = await listGroupsApi(admin, String(parentA.id));

            // Then only the children of that group are included
            checkGroupIncludedInListApi(data, childInA.id, parentA.id, CHILD_GROUP);
            expect(data.some((g) => g.id === childInB.id)).toBe(false);
            expect(data.some((g) => g.id === parentA.id)).toBe(false);
        });
    });

    describe('fetching a single group', () => {
        it('fetches a created root group by id', async () => {
            // Given a root group exists
            const group = await createTestGroup(admin);

            // When fetching the group by id
            const fetched = await getGroupApi(admin, group.id);

            // Then the API returns the group with matching data
            expect(fetched.title).toBe(TEST_GROUP.title);
            expect(fetched.name).toBe(TEST_GROUP.name);
            expect(fetched.parent_id ?? null).toBe(null);
        });

        it('fetches a created group inside a group by id', async () => {
            // Given a parent group with a child exists
            const parent = await createTestGroup(admin);
            const group = await createChildGroup(admin, parent.id);

            // When fetching the group by id
            const fetched = await getGroupApi(admin, group.id);

            // Then the API returns the group with matching data and parent
            expect(fetched.title).toBe(CHILD_GROUP.title);
            expect(fetched.name).toBe(CHILD_GROUP.name);
            expect(fetched.parent_id ?? null).toBe(parent.id);
        });

        it('rejects fetching a non-existent group', async () => {
            // When fetching a group id that does not exist
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                getGroupApi(admin, INVALID_GROUP_ID)
            ).rejects.toMatchObject({
                code,
            });
        });
    });

    describe('editing a group', () => {
        it('updates the group and returns the updated group', async () => {
            // Given a root group exists
            const group = await createTestGroup(admin);

            // When updating the group's details
            const updatedTitle = 'Updated Title';
            const updatedDescription = 'Updated description';
            const updatedGroup = await admin.client.groups.update({
                params: { id: String(group.id) },
                body: {
                    title: updatedTitle,
                    description: updatedDescription,
                },
            });

            // Then the API returns the updated group with the new fields
            expect(updatedGroup.title).toBe(updatedTitle);
            expect(updatedGroup.description).toBe(updatedDescription);
            expect(updatedGroup.created_by.timestamp).toBe(
                group.created_by.timestamp
            );
            expect(
                new Date(updatedGroup.updated_by.timestamp).getTime()
            ).toBeGreaterThan(new Date(group.updated_by.timestamp).getTime());

            // And the modification info points at the editing admin
            expectApiCreatedBy(updatedGroup, admin);
            expectApiUpdatedBy(updatedGroup, admin);
            expectApiUpdatedAfterCreated(updatedGroup);

            // And the updated group is persisted in the database
            const row = await findGroupRowById(group.id);
            expect(row).toBeDefined();
            expect(row?.title).toBe(updatedTitle);
            expect(row?.description).toBe(updatedDescription);
            expect(row?.created).toEqual(new Date(group.created_by.timestamp));
            expect(row?.updated.getTime()).toBeGreaterThan(
                new Date(group.updated_by.timestamp).getTime()
            );

            // And the modification info in the database points at the admin
            expectDbCreatedBy(row!, admin);
            expectDbUpdatedBy(row!, admin);
            expectDbUpdatedAfterCreated(row!);
        });

        it('records the updating user in the updated_by field', async () => {
            // Given the admin created a group
            const group = await createTestGroup(admin);

            // When user2 updates the group's details
            const updatedTitle = 'Updated Title';
            const updatedGroup = await user2.client.groups.update({
                params: { id: String(group.id) },
                body: {
                    title: updatedTitle,
                },
            });

            // Then the API returns the updated group with the new fields
            expect(updatedGroup.title).toBe(updatedTitle);

            // And the modification info keeps the original creator but
            // records user2 as the updater
            expectApiCreatedBy(updatedGroup, admin);
            expectApiUpdatedBy(updatedGroup, user2);
            expectApiUpdatedAfterCreated(updatedGroup);

            // And the modification info in the database matches
            const row = await findGroupRowById(group.id);
            expect(row).toBeDefined();
            expectDbCreatedBy(row!, admin);
            expectDbUpdatedBy(row!, user2);
            expectDbUpdatedAfterCreated(row!);
        });
    });

    describe('deleting a group', () => {
        it('deletes the group and it is no longer returned by the API', async () => {
            // Given a root group exists
            const group = await createTestGroup(admin);

            // When deleting the group
            await admin.client.groups.delete({
                params: { id: String(group.id) },
            });

            // Then the group is no longer persisted in the database
            const row = await findGroupRowById(group.id);
            expect(row).toBeNull();

            // Then the group is no longer returned when listing groups
            const { data } = await listGroupsApi(admin, '0');
            const matches = data.filter((g) => g.id === group.id);
            expect(matches).toHaveLength(0);

            // Then the group is no longer returned when fetching the group directly
            await expect(getGroupApi(admin, group.id)).rejects.toThrow();
        });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});

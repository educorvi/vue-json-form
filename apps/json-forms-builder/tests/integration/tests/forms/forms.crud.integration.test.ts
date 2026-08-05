import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource, findFormRowById } from '../../../support/db';
import type { Form as DbForm } from '~~/server/db/entities/Form';
import type { zCreateFormResponse } from '~~/server/orpc/generated/zod.gen';
import type z from 'zod';
import { ORPCError } from '@orpc/client';
import {
    expectApiCreatedAndUpdatedBy,
    expectApiUpdatedAfterCreated,
    expectApiCreatedBy,
    expectApiUpdatedBy,
} from '../../../support/resource-modifications';
import {
    expectDbCreatedAndUpdatedBy,
    expectDbUpdatedAfterCreated,
    expectDbCreatedBy,
    expectDbUpdatedBy,
} from '../../../support/db-resource-modifications';

// data

const TEST_GROUP = {
    title: 'Test Group',
    name: 'test-group',
};

const ADDITIONAL_GROUP = {
    title: 'Group B',
    name: 'group-b',
};

const TEST_FORM = {
    title: 'Test Form',
    name: 'test-form',
};

const INVALID_FORM_ID = 999999;

type FormCreationResponse = z.infer<typeof zCreateFormResponse>;

// helpers

function createTestGroup(
    admin: ProvisionedUser,
    groupData: Partial<typeof TEST_GROUP> = TEST_GROUP
) {
    return admin.client.groups.create({
        body: {
            title: groupData.title ?? TEST_GROUP.title,
            name: groupData.name ?? TEST_GROUP.name,
        },
    });
}

function createTestForm(admin: ProvisionedUser, parentGroupId?: number) {
    return admin.client.forms.create({
        body: { title: TEST_FORM.title, name: TEST_FORM.name },
        query: { id: parentGroupId ? String(parentGroupId) : '' },
    });
}

function getFormFromDb(id: number) {
    return findFormRowById(id);
}

function checkFormMatchesApi(
    form: FormCreationResponse,
    groupId: number | null
) {
    expect(form.title).toBe(TEST_FORM.title);
    expect(form.name).toBe(TEST_FORM.name);
    expect(form.parent_id).toBe(groupId);
}

function checkFormMatchesDb(form: DbForm | null, groupId: number | null) {
    expect(form).toBeDefined();
    expect(form?.title).toBe(TEST_FORM.title);
    expect(form?.name).toBe(TEST_FORM.name);
    expect(form?.group?.id ?? null).toBe(groupId);
}

function checkFormReturnedByApi(
    form: FormCreationResponse,
    parentGroupId: number | null = null,
    matchData: Partial<FormCreationResponse> = TEST_FORM
) {
    // expect(form.id).toBe(expect.any(Number));
    expect(form.title).toBe(matchData.title);
    expect(form.name).toBe(matchData.name);
    expect(form.parent_id ?? null).toBe(
        parentGroupId != null ? parentGroupId : (matchData.parent_id ?? null)
    );
    expect(form.description).toBe(matchData.description ?? null);
}

function listFormsApi(admin: ProvisionedUser, filter: string) {
    return admin.client.forms.list({
        query: {
            filter_parent_group: filter,
            page_size: 50,
        },
    });
}

function checkFormIncludedInListApi(
    forms: FormCreationResponse[],
    formId: number,
    parentGroupId: number | null = null,
    matchData: Partial<FormCreationResponse> = TEST_FORM
) {
    const matches = forms.filter((f) => f.id === formId);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.title).toBe(matchData.title);
    expect(matches[0]?.name).toBe(matchData.name);
    expect(matches[0]?.parent_id ?? null).toBe(
        parentGroupId != null ? parentGroupId : (matchData.parent_id ?? null)
    );
    expect(matches[0]?.description).toBe(matchData.description ?? null);
}

function listFormApi(admin: ProvisionedUser, parentGroupId?: number) {
    return admin.client.forms.get({
        params: { id: String(parentGroupId ?? '') },
    });
}

// tests

describe('Forms API', () => {
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

    describe('creating a root form', () => {
        it('creates a root form and returns it', async () => {
            // When creating a root form
            const form = await createTestForm(admin);

            // Then the API returns the form with the submitted fields
            checkFormMatchesApi(form, null);

            // And the modification info points at the creating admin
            expectApiCreatedAndUpdatedBy(form, admin);
            expectApiUpdatedAfterCreated(form);
        });

        it('persists a created root form in the database', async () => {
            // GIVEN creating a root form
            const form = await createTestForm(admin);

            // When looking the form up directly in the database
            const row = await getFormFromDb(form.id);

            // Then the row exists with matching data
            checkFormMatchesDb(row, null);

            // And the modification info points at the creating admin
            expectDbCreatedAndUpdatedBy(row!, admin);
            expectDbUpdatedAfterCreated(row!);
        });
    });

    describe('creating a form inside a group', () => {
        it('creates a form inside a group and returns it', async () => {
            // Given the admin created a group
            const group = await createTestGroup(admin);
            // When creating a form inside that group
            const form = await createTestForm(admin, group.id);

            // Then the API returns the form with the submitted fields
            checkFormMatchesApi(form, group.id);

            // And the modification info points at the creating admin
            expectApiCreatedAndUpdatedBy(form, admin);
            expectApiUpdatedAfterCreated(form);
        });

        it('persists a created form in the database', async () => {
            // Given a group with a form exists
            const group = await createTestGroup(admin);
            const form = await createTestForm(admin, group.id);

            // When looking the form up directly in the database
            const row = await getFormFromDb(form.id);

            // Then the row exists with matching data
            checkFormMatchesDb(row, group.id);

            // And the modification info points at the creating admin
            expectDbCreatedAndUpdatedBy(row!, admin);
            expectDbUpdatedAfterCreated(row!);
        });
    });

    describe('listing forms', () => {
        it('lists all forms', async () => {
            // Given a root form and a form inside a group exist
            const group = await createTestGroup(admin);
            const rootForm = await createTestForm(admin);
            const groupForm = await createTestForm(admin, group.id);

            // When listing all forms (no group filter)
            const { data } = await listFormsApi(admin, '');

            // Then both forms are included exactly once
            checkFormIncludedInListApi(data, rootForm.id);
            checkFormIncludedInListApi(data, groupForm.id, group.id);
        });

        it('lists root forms only', async () => {
            // Given a root form and a form inside a group exist
            const group = await createTestGroup(admin);
            const rootForm = await createTestForm(admin);
            const groupForm = await createTestForm(admin, group.id);

            // When listing only the root forms
            const { data } = await listFormsApi(admin, '0');

            // Then the root form is included exactly once
            checkFormIncludedInListApi(data, rootForm.id);

            // And the group form is not included
            expect(data.some((f) => f.id === groupForm.id)).toBe(false);
        });

        it('lists forms of a specific group only', async () => {
            // Given two groups each containing a form exist
            const groupA = await createTestGroup(admin);
            const groupB = await createTestGroup(admin, ADDITIONAL_GROUP);
            const formInGroupA = await createTestForm(admin, groupA.id);
            const formInGroupB = await createTestForm(admin, groupB.id);

            // When listing the forms of one group
            const { data } = await listFormsApi(admin, String(groupA.id));

            // Then only the forms of that group are included
            checkFormIncludedInListApi(data, formInGroupA.id, groupA.id);
            expect(data.some((f) => f.id === formInGroupB.id)).toBe(false);
        });
    });

    describe('fetching a single form', () => {
        it('fetches a created root form by id', async () => {
            // Given a root form exists
            const form = await createTestForm(admin);

            // When fetching the form by id
            const fetched = await listFormApi(admin, form.id);

            // Then the API returns the form with matching data
            checkFormReturnedByApi(fetched, null);
        });

        it('fetches a created form inside a group by id', async () => {
            // Given a group with a form exists
            const group = await createTestGroup(admin);
            const form = await createTestForm(admin, group.id);

            // When fetching the form by id
            const fetched = await listFormApi(admin, form.id);

            // Then the API returns the form with matching data and group
            checkFormReturnedByApi(fetched, group.id);
        });

        it('rejects fetching a non-existent form', async () => {
            // When fetching a form id that does not exist
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                listFormApi(admin, INVALID_FORM_ID)
            ).rejects.toMatchObject({
                code,
            });
        });
    });

    describe('editing a form', () => {
        it('updates the form and returns the updated form', async () => {
            // Given a group with a form exists
            const form = await createTestForm(admin);

            // When updating the form's details
            const updatedTitle = 'Updated Title';
            const updatedDescription = 'Updated description';
            const updatedVisibility = 'private';
            const updatedForm = await admin.client.forms.update({
                params: { id: String(form.id) },
                body: {
                    title: updatedTitle,
                    description: updatedDescription,
                    visibility: updatedVisibility,
                },
                query: { id: '' },
            });

            // Then the API returns the updated form with the new fields
            expect(updatedForm.title).toBe(updatedTitle);
            expect(updatedForm.description).toBe(updatedDescription);
            expect(updatedForm.created_by.timestamp).toBe(
                form.created_by.timestamp
            );
            expect(
                new Date(updatedForm.updated_by.timestamp).getTime()
            ).toBeGreaterThan(new Date(form.updated_by.timestamp).getTime());

            // And the modification info points at the editing admin
            expectApiCreatedBy(updatedForm, admin);
            expectApiUpdatedBy(updatedForm, admin);
            expectApiUpdatedAfterCreated(updatedForm);

            // And the updated form is persisted in the database
            const row = await getFormFromDb(form.id);
            expect(row).toBeDefined();
            expect(row?.title).toBe(updatedTitle);
            expect(row?.description).toBe(updatedDescription);
            expect(row?.created).toEqual(new Date(form.created_by.timestamp));
            expect(row?.updated.getTime()).toBeGreaterThan(
                new Date(form.updated_by.timestamp).getTime()
            );

            // And the modification info in the database points at the admin
            expectDbCreatedBy(row!, admin);
            expectDbUpdatedBy(row!, admin);
            expectDbUpdatedAfterCreated(row!);

            // And the updated form is included when listing forms
            const { data } = await listFormsApi(admin, '');
            const matches = data.filter((f) => f.id === form.id);
            expect(matches).toHaveLength(1);
            expect(matches[0]?.title).toBe(updatedTitle);
            expect(matches[0]?.description).toBe(updatedDescription);
            expect(matches[0]?.created_by.timestamp).toBe(
                form.created_by.timestamp
            );
            expect(
                new Date(matches[0]?.updated_by.timestamp ?? 0).getTime()
            ).toBeGreaterThan(new Date(form.updated_by.timestamp).getTime());
        });

        it('records the updating user in the updated_by field', async () => {
            // Given the admin created a form
            const form = await createTestForm(admin);

            // When user2 updates the form's details
            const updatedTitle = 'Updated Title';
            const updatedForm = await user2.client.forms.update({
                params: { id: String(form.id) },
                body: {
                    title: updatedTitle,
                },
                query: { id: '' },
            });

            // Then the API returns the updated form with the new fields
            expect(updatedForm.title).toBe(updatedTitle);

            // And the modification info keeps the original creator but
            // records user2 as the updater
            expectApiCreatedBy(updatedForm, admin);
            expectApiUpdatedBy(updatedForm, user2);
            expectApiUpdatedAfterCreated(updatedForm);

            // And the modification info in the database matches
            const row = await getFormFromDb(form.id);
            expect(row).toBeDefined();
            expectDbCreatedBy(row!, admin);
            expectDbUpdatedBy(row!, user2);
            expectDbUpdatedAfterCreated(row!);
        });
    });

    describe('deleting a form', () => {
        it('deletes the form and it is no longer returned by the API', async () => {
            // Given a group with a form exists
            const form = await createTestForm(admin);

            // When deleting the form
            await admin.client.forms.delete({
                params: { id: String(form.id) },
            });

            // Then the form is no longer persisted in the database
            const row = await getFormFromDb(form.id);
            expect(row).toBeNull();

            // Then the form is no longer returned when listing forms
            const { data } = await listFormsApi(admin, '');
            const matches = data.filter((f) => f.id === form.id);
            expect(matches).toHaveLength(0);

            // Then the form is no longer returned when fetching the form directly
            await expect(listFormApi(admin, form.id)).rejects.toThrow();
        });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});

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
    INVALID_FORM_ID,
    createTestForm,
    listFormsApi,
    getFormApi,
    checkFormMatchesApi,
    checkFormReturnedByApi,
    checkFormIncludedInListApi,
} from '../../../support/api/forms';
import { findFormRowById, checkFormMatchesDb } from '../../../support/db/forms';
import { ADDITIONAL_GROUP, createTestGroup } from '../../../support/api/groups';

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
            const row = await findFormRowById(form.id);

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
            const row = await findFormRowById(form.id);

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
            const fetched = await getFormApi(admin, form.id);

            // Then the API returns the form with matching data
            checkFormReturnedByApi(fetched, null);
        });

        it('fetches a created form inside a group by id', async () => {
            // Given a group with a form exists
            const group = await createTestGroup(admin);
            const form = await createTestForm(admin, group.id);

            // When fetching the form by id
            const fetched = await getFormApi(admin, form.id);

            // Then the API returns the form with matching data and group
            checkFormReturnedByApi(fetched, group.id);
        });

        it('rejects fetching a non-existent form', async () => {
            // When fetching a form id that does not exist
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                getFormApi(admin, INVALID_FORM_ID)
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
            const row = await findFormRowById(form.id);
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
            const row = await findFormRowById(form.id);
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
            const row = await findFormRowById(form.id);
            expect(row).toBeNull();

            // Then the form is no longer returned when listing forms
            const { data } = await listFormsApi(admin, '');
            const matches = data.filter((f) => f.id === form.id);
            expect(matches).toHaveLength(0);

            // Then the form is no longer returned when fetching the form directly
            await expect(getFormApi(admin, form.id)).rejects.toThrow();
        });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});

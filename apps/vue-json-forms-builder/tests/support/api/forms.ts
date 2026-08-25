import { expect } from 'vitest';
import type { ProvisionedUser } from '../provision';
import type { zCreateFormResponse } from '../../../server/orpc/generated/zod.gen';
import type z from 'zod';

// ── Test data ─────────────────────────────────────────────────────────────

export const TEST_FORM = {
    title: 'Test Form',
    name: 'test-form',
};

export const INVALID_FORM_ID = 999999;

// ── Types ─────────────────────────────────────────────────────────────────

export type FormCreationResponse = z.infer<typeof zCreateFormResponse>;

// ── API actions ───────────────────────────────────────────────────────────

export function createTestForm(admin: ProvisionedUser, parentGroupId?: number) {
    return admin.client.forms.create({
        body: { title: TEST_FORM.title, name: TEST_FORM.name },
        query: { id: parentGroupId ? String(parentGroupId) : '' },
    });
}

export function listFormsApi(admin: ProvisionedUser, filter: string) {
    return admin.client.forms.list({
        query: {
            filter_parent_group: filter,
            page_size: 50,
        },
    });
}

export function getFormApi(admin: ProvisionedUser, formId: number) {
    return admin.client.forms.get({
        params: { id: String(formId) },
    });
}

// ── Assertions ────────────────────────────────────────────────────────────

export function checkFormMatchesApi(
    form: FormCreationResponse,
    groupId: number | null
) {
    expect(form.title).toBe(TEST_FORM.title);
    expect(form.name).toBe(TEST_FORM.name);
    expect(form.parent_id).toBe(groupId);
}

export function checkFormReturnedByApi(
    form: FormCreationResponse,
    parentGroupId: number | null = null,
    matchData: Partial<FormCreationResponse> = TEST_FORM
) {
    expect(form.title).toBe(matchData.title);
    expect(form.name).toBe(matchData.name);
    expect(form.parent_id ?? null).toBe(
        parentGroupId != null ? parentGroupId : (matchData.parent_id ?? null)
    );
    expect(form.description).toBe(matchData.description ?? null);
}

export function checkFormIncludedInListApi(
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

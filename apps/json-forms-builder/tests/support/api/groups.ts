import { expect } from 'vitest';
import type { ProvisionedUser } from '../provision';
import type { zCreateGroupResponse } from '../../../server/orpc/generated/zod.gen';
import type z from 'zod';

// ── Test data ─────────────────────────────────────────────────────────────

export const TEST_GROUP = {
    title: 'Test Group',
    name: 'test-group',
};

export const CHILD_GROUP = {
    title: 'Child Group',
    name: 'child-group',
};

export const SECOND_CHILD_GROUP = {
    title: 'Second Child Group',
    name: 'second-child-group',
};

export const ADDITIONAL_GROUP = {
    title: 'Group B',
    name: 'group-b',
};

export const INVALID_GROUP_ID = 999999;

// ── Types ─────────────────────────────────────────────────────────────────

export type GroupCreationResponse = z.infer<typeof zCreateGroupResponse>;

// ── API actions ───────────────────────────────────────────────────────────

export function createTestGroup(
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

export function createChildGroup(
    admin: ProvisionedUser,
    parentGroupId: number,
    groupData: Partial<typeof CHILD_GROUP> = CHILD_GROUP
) {
    return admin.client.groups.create({
        body: {
            title: groupData.title,
            name: groupData.name,
        },
        query: { parent: String(parentGroupId) },
    });
}

export function listGroupsApi(admin: ProvisionedUser, filter: string) {
    return admin.client.groups.list({
        query: {
            filter_parent_group: filter,
            page_size: 50,
        },
    });
}

export function getGroupApi(admin: ProvisionedUser, groupId: number) {
    return admin.client.groups.get({
        params: { id: String(groupId) },
    });
}

// ── Assertions ────────────────────────────────────────────────────────────

export function checkGroupMatchesApi(
    group: GroupCreationResponse,
    parentGroupId: number | null
) {
    expect(group.title).toBe(TEST_GROUP.title);
    expect(group.name).toBe(TEST_GROUP.name);
    expect(group.parent_id ?? null).toBe(parentGroupId);
}

export function checkGroupIncludedInListApi(
    groups: GroupCreationResponse[],
    groupId: number,
    parentGroupId: number | null = null,
    matchData: Partial<GroupCreationResponse> = TEST_GROUP
) {
    const matches = groups.filter((g) => g.id === groupId);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.title).toBe(matchData.title);
    expect(matches[0]?.name).toBe(matchData.name);
    expect(matches[0]?.parent_id ?? null).toBe(parentGroupId);
}

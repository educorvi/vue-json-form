import { expect } from 'vitest';
import { Group } from '../../../server/db/entities/Group';
import { getTestDataSource } from './db';
import { TEST_GROUP } from '../api/groups';

/**
 * Fetches a group row directly from the database, loading the relations
 * needed by the DB-level resource-modification helpers
 * (tests/support/db/db-resource-modifications.ts).
 */
export async function findGroupRowById(id: number) {
    const dataSource = await getTestDataSource();
    return dataSource.getRepository(Group).findOne({
        where: { id },
        relations: {
            parent: true,
            created_by: true,
            updated_by: true,
        },
    });
}

export function checkGroupMatchesDb(
    group: Group | null,
    parentGroupId: number | null
) {
    expect(group).toBeDefined();
    expect(group?.title).toBe(TEST_GROUP.title);
    expect(group?.name).toBe(TEST_GROUP.name);
    expect(group?.parent_id ?? null).toBe(parentGroupId);
}

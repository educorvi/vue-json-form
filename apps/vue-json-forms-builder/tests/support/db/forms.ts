import { expect } from 'vitest';
import { Form } from '@educorvi/vue-json-forms-builder-db-layer';
import { getTestDataSource } from './db';
import { TEST_FORM } from '../api/forms';

/**
 * Fetches a form row directly from the database, loading the relations
 * needed by the DB-level resource-modification helpers
 * (tests/support/db/db-resource-modifications.ts).
 */
export async function findFormRowById(id: number) {
    const dataSource = await getTestDataSource();
    return dataSource.getRepository(Form).findOne({
        where: { id },
        relations: {
            group: true,
            created_by: true,
            updated_by: true,
        },
    });
}

export function checkFormMatchesDb(form: Form | null, groupId: number | null) {
    expect(form).toBeDefined();
    expect(form?.title).toBe(TEST_FORM.title);
    expect(form?.name).toBe(TEST_FORM.name);
    expect(form?.group?.id ?? null).toBe(groupId);
}

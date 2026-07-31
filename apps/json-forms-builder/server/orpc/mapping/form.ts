import { Form } from '~~/server/db/entities/Form';
import type { ApiForm } from '~~/server/services/FormService';
import type { ApiParentPath } from '~~/server/services/GroupService';
import { mapVisibilityToApi } from './shared';

export function mapDbFormToApiForm(
    form: Form,
    parentPath: ApiParentPath | null = null
): ApiForm {
    return {
        id: form.id,
        title: form.title,
        name: form.name,
        description: form.description,
        visibility: mapVisibilityToApi(form.visibility),
        parent_path: parentPath,
        parent_id: form.group?.id ?? null,
        created_by: {
            id: form.created_by?.id ?? '0',
            name: form.created_by?.name ?? 'System',
            email: form.created_by?.email ?? 'system@example.com',
            timestamp: form.created.toISOString(),
        },
        updated_by: {
            id: form.updated_by?.id ?? '0',
            name: form.updated_by?.name ?? 'System',
            email: form.updated_by?.email ?? 'system@example.com',
            timestamp: form.updated.toISOString(),
        },
    };
}

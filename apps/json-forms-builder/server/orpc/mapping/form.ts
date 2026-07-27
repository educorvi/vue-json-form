import { Form } from '~~/server/db/entities/Form';
import { ApiParentPath, ApiForm } from '~~/server/services/FormService';

export function mapDbFormToApiForm(
    form: Form,
    parentPath: ApiParentPath | null = null
): ApiForm {
    return {
        id: form.id,
        title: form.title,
        name: form.name,
        description: form.description,
        visibility: form.visibility,
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
        path: form.path,
    } as ApiForm;
}

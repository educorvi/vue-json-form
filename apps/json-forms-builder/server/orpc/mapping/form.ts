import { Form } from '~~/server/db/entities/Form';
import type { ApiForm } from '~~/server/services/FormService';
import type { ApiParentPath } from '~~/server/services/GroupService';
import { mapVisibilityToApi, toAuditRef } from './shared';

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
        created_by: toAuditRef(form.created_by, form.created.toISOString()),
        updated_by: toAuditRef(form.updated_by, form.updated.toISOString()),
    };
}

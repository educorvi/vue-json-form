import { formCrudProcedures } from './crud';
import { formSchemaProcedures } from './schema';
import { formPermissionProcedures } from './permissions';
import { formVersionProcedures } from './versions';

export const formsRouter = {
    ...formCrudProcedures,
    schema: { ...formSchemaProcedures },
    permissions: { ...formPermissionProcedures },
    versions: { ...formVersionProcedures },
};

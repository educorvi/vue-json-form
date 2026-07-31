import { groupCrudProcedures } from './crud';
import { groupPermissionProcedures } from './permissions';
import { groupTreeProcedures } from './tree';

export const groupsRouter = {
    ...groupCrudProcedures,
    permissions: { ...groupPermissionProcedures },
    ...groupTreeProcedures,
};

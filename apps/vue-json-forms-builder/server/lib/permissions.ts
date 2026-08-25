/**
 * Barrel file — re-exports everything from the new split permissions module.
 *
 * The permission system has been refactored into `server/lib/permissions/`:
 *   roles.ts       — Role, ROLE_HIERARCHY, helpers, computeEffectiveRole()
 *   visibility.ts  — VisibilityGrant enum
 *   policies.ts   — PermissionPolicy class + policy constants
 *
 * This barrel preserves all existing imports while letting the codebase
 * migrate to the new structure incrementally.
 */
export type { Role } from './permissions/roles';
export {
    ROLES,
    ROLE_HIERARCHY,
    hasRole,
    hasPermission,
    roleLabel,
    computeEffectiveRole,
} from './permissions/roles';
export {
    VisibilityGrant,
    isGrantedByVisibility,
} from './permissions/visibility';
export { PermissionPolicy } from './permissions/policies';
export {
    ResourceViewPermission,
    ResourceUpdatePermission,
    ResourceDeletePermission,
    ResourceCreateChildPermission,
    ResourceManagePermissionsPermission,
    FormSchemaManagePermission,
    FormVersionCreatePermission,
} from './permissions/policies';

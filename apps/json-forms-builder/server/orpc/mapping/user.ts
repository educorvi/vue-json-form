import { User as DbUser } from '~~/server/db/entities/User';
import { ApiUser, ApiUserOrderBy } from '~~/server/services/UserService';

// Mappers

// function resolveDbUserToSystemFallback(u: DbUser): ApiUser {
//     return {
//         id: u.id,
//         name: u.name,
//         email: u.email,
//         role: u.role,
//         created: u.created.toISOString(),
//         updated: u.updated.toISOString(),
//     };
// }

// const mapDbUserToApiUserRef = (u: DbUser): ApiUserRef => ({
//     id: u.id,
//     name: u.name,
//     email: u.email,
//     role: u.role,
// });

export const mapDbUserToApiUser = (u: DbUser): ApiUser => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    created: u.created.toISOString(),
    updated: u.updated.toISOString(),
}); // type ApiUserRef = z.infer<typeof zUserRef>;

// Enum Mappers
export const MAP_API_ORDER_BY_TO_DB: Record<ApiUserOrderBy, keyof DbUser> = {
    id: 'id',
    name: 'name',
    email: 'email',
    created: 'created',
    last_activity: 'updated',
    role: 'role',
};

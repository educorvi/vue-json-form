// map db user to api user:

// import { User } from '~~/server/db/entities/User';
// import z from 'zod';
// import { zUser } from '~~/server/orpc/generated/zod.gen';

// type ApiUser = z.infer<typeof zUser>;

// // toApiUser maps a User entity to an ApiUser object.
// export function toApiUser(user: User): ApiUser {
//     return {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         created: user.created.toISOString(),
//         updated: user.updated.toISOString(),
//     };
// }

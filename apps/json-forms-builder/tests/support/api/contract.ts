/**
 * Shared introspection of the oRPC app contract for contract-wide
 * integration tests (auth-required, input-validation).
 *
 * The contract (server/orpc/contract.ts) is the single source of truth
 * for which procedures exist — tests derive their procedure lists from
 * it at runtime instead of duplicating them, so any procedure added to
 * the contract is automatically covered.
 */
import { appContract } from '../../../server/orpc/contract';

export type ContractNode = Record<string, unknown>;

/** A procedure path like `groups.permissions.list` (excluding the root). */
export type ProcedurePath = string[];

/**
 * Recursively walks the contract and collects every procedure as a dotted path, e.g. `['groups', 'permissions', 'list']`.
 *
 * Namespaces are recursed into; route objects (identified by their `~orpc` key) are collected as leaves. Without this distinction the
 * walker would descend into the route's zod schemas (`~orpc.inputSchema`, `~orpc.outputSchema`, ...) and explode into tens of thousands of phantom procedures.
 */
export function collectProcedures(
    node: ContractNode,
    path: ProcedurePath = []
): ProcedurePath[] {
    const procedures: ProcedurePath[] = [];
    for (const [key, value] of Object.entries(node)) {
        const nextPath = [...path, key];
        if (value && typeof value === 'object' && !('~orpc' in value)) {
            // A namespace — recurse.
            procedures.push(
                ...collectProcedures(value as ContractNode, nextPath)
            );
        } else {
            // A route object (or a leaf) — it is a procedure.
            procedures.push(nextPath);
        }
    }
    return procedures;
}

/** All procedure paths derived from the contract, e.g. `groups.list`. */
export const ALL_PROCEDURES: string[] = collectProcedures(
    appContract as unknown as ContractNode
)
    .map((p) => p.join('.'))
    .sort();

/**
 * Resolves a dotted procedure path on the contract, e.g. `groups.permissions.list` → `appContract.groups.permissions.list`.
 * Used to read a route's metadata (e.g. its input schema).
 */
export function resolveRoute(path: string): ContractNode {
    let target: unknown = appContract;
    for (const segment of path.split('.')) {
        target = (target as Record<string, unknown>)[segment];
    }
    return target as ContractNode;
}

/**
 * Whether the route declares an input schema (`.input(...)` in the generated contract). Routes without one (e.g. `status.get`,
 * `users.create`) have nothing to validate — requests to them can never be rejected with BAD_REQUEST, regardless of the payload.
 */
export function hasInputSchema(route: ContractNode): boolean {
    const orpc = route['~orpc'] as { inputSchema?: unknown } | undefined;
    return orpc?.inputSchema != null;
}

/**
 * A payload that is invalid for every input section oRPC validates.
 *
 * Every contract route uses the detailed input structure `{ params?, query?, body? }` where each section is an object schema.
 * Providing every section as a string is guaranteed to fail validation for whichever sections the route actually declares — an invalid
 * "request body", "strange query" and "bad params" all at once.
 */
export const GARBAGE_INPUT: Record<string, unknown> = {
    params: 'garbage!',
    query: 'garbage!',
    body: 'garbage!',
};

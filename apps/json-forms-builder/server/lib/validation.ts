/**
 * Validation utilities for resource names.
 *
 * Names must start with a letter (a-z, A-Z) — they may contain numbers,
 * hyphens, and underscores after the first character.
 */

import { ORPCError } from '@orpc/server';

const NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

/**
 * Validate that a name starts with a letter and contains only
 * allowed characters (letters, digits, hyphens, underscores).
 * Throws a readable error if invalid.
 *
 * @param name     The name to validate
 * @param label    Human-readable label for error messages (e.g. "Group name", "Form name")
 */
export function validateUrlName(name: string, label: string): void {
    if (!name || name.trim().length === 0) {
        throw new ORPCError('UNPROCESSABLE_CONTENT', {
            message: `${label} is required.`,
        });
    }
    if (!NAME_REGEX.test(name)) {
        throw new ORPCError('UNPROCESSABLE_CONTENT', {
            message: `${label} must start with a letter and may contain letters, digits, hyphens, and underscores.`,
        });
    }
}

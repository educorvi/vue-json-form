import { ORPCError } from '@orpc/server';
import { createHash, randomBytes } from 'node:crypto';
import { type DataSource, type Repository } from 'typeorm';
import z from 'zod';
import { ApiKey } from '~~/server/db/entities/ApiKey';
import {
    zApiKey,
    zCreateApiKeyBody,
    zCreateApiKeyResponse,
    zListApiKeysResponse,
    zPatchApiKeyBody,
} from '../orpc/generated/zod.gen';
import { User } from '../db/entities/User';
import { mapDbApiKeyToResponse } from '../orpc/mapping/api-key';

// API types from Zod schemas

type CreateApiKeyBody = z.infer<typeof zCreateApiKeyBody>;
type PatchApiKeyBody = z.infer<typeof zPatchApiKeyBody>;

type CreateApiKeyResponse = z.infer<typeof zCreateApiKeyResponse>;

export type ResponseApiKey = z.infer<typeof zApiKey>;
type ResponseApiKeyList = z.infer<typeof zListApiKeysResponse>;

// Constants for API key generation and hashing

const TOKEN_PREFIX = 'fb_';
const TOKEN_BYTES = 32; // 256-bit token
const HASH_ALGO = 'sha256';
const IDENTIFIER_PREFIX_LEN = 4;
const IDENTIFIER_SUFFIX_LEN = 4;

/**
 * Service for managing API keys, including creation, listing, updating, and deletion.
 * Provides methods to generate secure tokens, hash them, and validate them.
 */
export class ApiKeyService {
    private readonly repo: Repository<ApiKey>;

    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(ApiKey);
    }

    /**
     * Generate a cryptographically secure API key token.
     * Format: fb_<random-hex>
     */
    static generateToken(): string {
        const bytes = randomBytes(TOKEN_BYTES);
        return TOKEN_PREFIX + bytes.toString('hex');
    }

    /**
     * Hash a token using SHA-256.
     */
    static hashToken(token: string): string {
        return createHash(HASH_ALGO).update(token).digest('hex');
    }

    /**
     * Create a short identifier from a token only including the start and end of the token (e.g. "fb_a4...f7").
     */
    static createIdentifier(token: string): string {
        const prefix = token.slice(
            0,
            IDENTIFIER_PREFIX_LEN + TOKEN_PREFIX.length
        );
        const suffix = token.slice(-IDENTIFIER_SUFFIX_LEN);
        return `${prefix}...${suffix}`;
    }

    /**
     * List all API keys for a user.
     */
    async listByUser(userId: string): Promise<ResponseApiKeyList> {
        const keys = await this.repo.find({
            where: { user: { id: userId } },
            order: { created: 'DESC' },
        });
        return keys.map((k) => mapDbApiKeyToResponse(k));
    }

    /**
     * Create a new API key for a user.
     */
    async create(
        userId: string,
        dto: CreateApiKeyBody,
        actorId?: string
    ): Promise<CreateApiKeyResponse> {
        const processedName = dto.name.trim();
        if (processedName.length === 0) {
            throw new ORPCError('UNPROCESSABLE_CONTENT', {
                message: 'API key name cannot be empty',
            });
        }

        const token = ApiKeyService.generateToken();
        const hash = ApiKeyService.hashToken(token);
        const identifier = ApiKeyService.createIdentifier(token);

        const key = this.repo.create({
            name: processedName,
            description: dto.description ?? null,
            hash,
            identifier,
            expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
            user: { id: userId },
        });

        const saved = await this.repo.save(key);
        return {
            ...mapDbApiKeyToResponse(saved),
            token,
        };
    }

    /**
     * Update an API key's name and/or description.
     */
    async patch(
        id: number,
        userId: string,
        dto: PatchApiKeyBody
    ): Promise<ResponseApiKey> {
        // Validate input
        const processedName = dto.name?.trim();
        if (processedName !== undefined && processedName.length === 0) {
            throw new ORPCError('UNPROCESSABLE_CONTENT', {
                message: 'API key name cannot be empty',
            });
        }
        const processedDescription = dto.description?.trim();
        if (
            processedDescription !== undefined &&
            processedDescription.length === 0
        ) {
            throw new ORPCError('UNPROCESSABLE_CONTENT', {
                message: 'API key description cannot be empty',
            });
        }
        if (processedName === undefined && processedDescription === undefined) {
            throw new ORPCError('UNPROCESSABLE_CONTENT', {
                message: 'At least one of name or description must be provided',
            });
        }

        // Find the key and ensure it belongs to the user
        const key = await this.repo.findOne({
            where: { id, user: { id: userId } } as any,
        });
        if (!key) {
            throw new ORPCError('NOT_FOUND', { message: 'API key not found' });
        }

        // Set the new values if provided
        if (processedName !== undefined) {
            key.name = processedName;
        }
        if (processedDescription !== undefined) {
            key.description = processedDescription;
        }

        // Update the key in the database and return the updated response
        const saved = await this.repo.save(key);
        return mapDbApiKeyToResponse(saved);
    }

    /**
     * Delete an API key.
     */
    async delete(id: number, userId: string): Promise<void> {
        const key = await this.repo.findOne({
            where: { id, user: { id: userId } } as any,
        });
        if (!key) {
            throw new ORPCError('NOT_FOUND', { message: 'API key not found' });
        }
        await this.repo.delete(id);
    }

    /**
     * Validates an API key token and returns the associated user if valid.
     * Throws an ORPCError with 'UNAUTHORIZED' if the token is invalid or expired.
     * @param token The API key token to validate.
     * @returns The User associated with the valid API key.
     * @throws ORPCError if the token is invalid or expired.
     */
    async validateToken(token: string): Promise<User> {
        if (!token.startsWith(TOKEN_PREFIX))
            throw new ORPCError('UNAUTHORIZED', {
                message: `Invalid token format. Token must start with "${TOKEN_PREFIX}", but received token starting with "${token.slice(
                    0,
                    TOKEN_PREFIX.length
                )}..."`,
            });

        const hash = ApiKeyService.hashToken(token);
        const key = await this.repo.findOne({
            where: { hash },
            relations: { user: true },
        });
        if (!key)
            throw new ORPCError('UNAUTHORIZED', { message: 'Invalid API key' });

        // TODO: an expire api key could be stores as such in the database so requests in the future don't need to check the date again.
        if (key.expires_at && new Date(key.expires_at) < new Date())
            throw new ORPCError('UNAUTHORIZED', {
                message: 'API key has expired',
            });

        return key.user;
    }
}

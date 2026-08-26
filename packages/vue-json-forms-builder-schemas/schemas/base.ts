import { z } from 'zod';

// Makes keys K of T optional, leaves the rest untouched.
export type PartialBy<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

// EntityData with "uid" always optional, plus any extra keys K a subclass wants optional.
// export type OptionalEntityData<T extends EntityData = EntityData, K extends keyof T = never> = PartialBy<T, K | "uid">;

type EntityData = z.infer<typeof Entity.schema>;
const entityDefaults = { uid: '' };
export type EntityOptionalKeys = keyof typeof entityDefaults;
export abstract class Entity {
    data: EntityData;

    static schema = z.object({
        uid: z.string().readonly(),
        id: z.string(),
    });

    constructor(data: PartialBy<EntityData, EntityOptionalKeys>) {
        this.data = Entity.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<EntityData, EntityOptionalKeys>
    ): EntityData {
        return {
            ...entityDefaults,
            uid: data.uid || globalThis.crypto.randomUUID(),
            ...data,
        };
    }

    toJSON(): EntityData {
        return this.data;
    }

    get id(): string {
        return this.data.id;
    }

    get uid(): string {
        return this.data.uid;
    }
}

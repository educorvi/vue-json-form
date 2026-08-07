import { z } from "zod";
import { createId } from "../utils";

type EntityData = z.infer<typeof Entity.schema>;
export abstract class Entity {
    data: EntityData;

    static schema = z.object({
        uid: z.string().readonly(),
        id: z.string()
    });

    constructor(data: Partial<EntityData>) {
        const id = data.id ? createId(data.id) : createId(this.constructor.name);
        this.data = {
            id: id,
            uid: data.uid || createId(id) + "_" + globalThis.crypto.randomUUID()
        };
    }

    toJSON(): string {
        return JSON.stringify(this.data);
    }

    getID(): string {
        // return this.id;
        return this.data.id;
    }
}




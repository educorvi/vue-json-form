import { z } from "zod";
import { createId } from "../utils";

export abstract class Entity {
    readonly uid: string;
    id!: string;

    // more attributes
    static schema = z.object({
        id: z.string()
    });

    constructor(id?: string) {
        this.uid = globalThis.crypto.randomUUID();
        this.id = id ? createId(id) : createId(this.constructor.name);
    }

    getID(): string {
        return this.id;
    }
}




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
        this.id = id ? createId(id) : createId(this.constructor.name);
        this.uid = this.id + "_" + globalThis.crypto.randomUUID();
    }

    getID(): string {
        return this.id;
    }
}




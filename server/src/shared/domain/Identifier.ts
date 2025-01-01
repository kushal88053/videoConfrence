import { ObjectId } from 'mongodb';

export class Identifier<T = ObjectId> {
    constructor(private readonly value: T) { }

    equals(id?: Identifier<T>): boolean {
        if (!id) {
            return false;
        }
        if (!(id instanceof Identifier)) {
            return false;
        }
        return this.toString() === id.toString();
    }

    toString(): string {
        return this.value instanceof ObjectId ? this.value.toHexString() : String(this.value);
    }

    /**
     * Return the raw value of the identifier
     */
    toValue(): T {
        return this.value;
    }

    /**
     * Check if the identifier is valid
     */
    static isValid(id: string): boolean {
        return ObjectId.isValid(id);
    }

    /**
     * Create a new Identifier with a fresh ObjectId
     */
    static createNew(): Identifier<ObjectId> {
        return new Identifier(new ObjectId());
    }
}

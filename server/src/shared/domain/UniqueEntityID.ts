import { ObjectId } from 'mongodb';
import { Identifier } from './Identifier';

export class UniqueEntityID extends Identifier<ObjectId> {
    constructor(id?: string | ObjectId) {
        super(id ? (typeof id === 'string' ? new ObjectId(id) : id) : new ObjectId());
    }

    // Create a UniqueEntityID from a string
    static createFromString(id: string): UniqueEntityID {
        if (!UniqueEntityID.isValid(id)) {
            throw new Error('Invalid entity id provided: ' + id);
        }
        return new UniqueEntityID(id);
    }

    // Check if a given id is a valid ObjectId
    static isValid(id: any): boolean {
        if (typeof id === 'string') {
            return ObjectId.isValid(id);
        } else if (id instanceof UniqueEntityID) {
            return ObjectId.isValid(id.toString());
        } else if (id instanceof ObjectId) {
            return ObjectId.isValid(id.toHexString());
        }
        return false;
    }

    // Get the string representation of the ObjectId
    toString(): string {
        return this.toValue().toHexString();
    }
}

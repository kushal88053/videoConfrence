import { UniqueEntityID } from './UniqueEntityID';  // Ensure to import UniqueEntityID

const isEntity = (v: unknown): v is Entity<unknown> => {
    return v instanceof Entity;
};

export abstract class Entity<T> {
    protected readonly _id: UniqueEntityID; // Use UniqueEntityID instead of ObjectId
    public readonly props: T;

    constructor(props: T, id?: UniqueEntityID) {
        this._id = id || new UniqueEntityID(); // Use provided ID or generate a new one
        this.props = props;
    }

    get id(): UniqueEntityID {
        return this._id;
    }

    public equals(object?: Entity<T>): boolean {
        if (!object) {
            return false;
        }

        if (this === object) {
            return true;
        }

        if (!isEntity(object)) {
            return false;
        }

        return this._id.equals(object._id); // Use UniqueEntityID's equals method
    }
}

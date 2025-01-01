interface ValueObjectProps {
    [key: string]: any;
}

/**
 * @desc ValueObjects are objects whose equality is determined
 * based on their structural properties.
 */
export abstract class ValueObject<T extends ValueObjectProps> {
    protected readonly props: T;

    constructor(props: T) {
        this.props = { ...props };
    }

    /**
     * Compares this ValueObject with another for equality based on their properties.
     * @param vo - Another ValueObject to compare.
     * @returns True if both ValueObjects have the same properties, otherwise false.
     */
    public equals(vo?: ValueObject<T>): boolean {
        if (vo == null || vo.props == null) {
            return false;
        }
        return JSON.stringify(this.props) === JSON.stringify(vo.props);
    }
}
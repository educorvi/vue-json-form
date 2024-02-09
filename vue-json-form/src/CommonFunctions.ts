/**
 * This function is used to map an array of elements to a new array where each element in the new array will have all the properties of the original element plus a 'uuid' property.
 * The 'uuid' property is generated using the 'crypto.randomUUID()' function.
 *
 * @param element The original array of elements.
 * @returns The new array where each element is an object that includes all properties of the original element and a 'uuid' property.
 */
export function mapUUID<T>(element: T[]): Array<T & { uuid: string }> {
    return element.map((el) => ({ ...el, uuid: crypto.randomUUID() }));
}

export function mapUUID<T>(element: T[]): Array<T & { uuid: string }> {
    return element.map((el) => ({ ...el, uuid: crypto.randomUUID() }))
}

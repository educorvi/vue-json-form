/**
 * Sets a property on an object based on a scoped key.
 *
 * This function takes an object, a scoped key (which represents a path), and a value.
 * It then sets the value at the specified path within the object, creating nested
 * objects or arrays as necessary.
 *
 * @param object - The object on which the property will be set.
 * @param key - The scoped key representing the path where the value should be set.
 * @param value - The value to set at the specified path.
 **/
export function setPropertyByScope(
    object: Record<any, any>,
    key: string,
    value: any
): void {
    const TEMP_INDEX_ESCAPE = '!#index#!';
    const indexRegex = new RegExp(
        `${TEMP_INDEX_ESCAPE}\\w+${TEMP_INDEX_ESCAPE}`
    );

    // Do not write anything if the value is undefined
    if (value === undefined) {
        return;
    }

    // Split the key by '/' and filter out empty strings and 'properties'
    // at even indices to get the actual path from the path in the json schema
    const splitKey = key
        .split('/')
        .filter((x) => x !== '')
        .filter((x, index) => !(index % 2 === 0 && x === 'properties'))
        .join('.')
        .replace(/\[(\w+)]/g, `.${TEMP_INDEX_ESCAPE}$1${TEMP_INDEX_ESCAPE}`)
        .split('.');

    // Create necessary nested objects or arrays and set the value at the specified path
    for (let i = 0; i < splitKey.length; i++) {
        let nextKey: string | number | undefined = splitKey[i];
        if (!nextKey) continue;
        if (indexRegex.test(nextKey)) {
            nextKey = parseInt(nextKey.replace(TEMP_INDEX_ESCAPE, ''));
        }

        if (i === splitKey.length - 1) {
            object[nextKey] = object[nextKey] || value;
        } else {
            if (indexRegex.test(splitKey[i + 1] ?? '')) {
                object[nextKey] = object[nextKey] || [];
            } else {
                object[nextKey] = object[nextKey] || {};
            }
            object = object[nextKey];
        }
    }
}

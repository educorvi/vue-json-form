function formatValue(
    value: any,
    currentKey: Readonly<string>,
    data: Readonly<Record<string, any>>,
    arrayValueKeys: string[]
): any {
    if (Array.isArray(value)) {
        return value.map((v) => {
            const subKey = currentKey + '.' + v;
            const newValue = formatValue(
                data[subKey] !== undefined ? data[subKey] : v,
                subKey,
                data,
                arrayValueKeys
            );
            // delete data[subKey];
            arrayValueKeys.push(subKey);
            return newValue;
        });
    } else if (typeof value === 'object') {
        return formatObject(value);
    } else {
        return value;
    }
}

function setPropertyByString(o: any, s: string, v: any): void {
    if (v === undefined) {
        return;
    }
    s = s.replace(/\[(\w+)]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, ''); // strip a leading dot

    const a = s
        .split('/')
        .filter((x) => x !== '')
        .filter((x, i) => !(x === 'properties' && i % 2 === 0));

    for (let i = 0, n = a.length; i < n - 1; ++i) {
        const k = a[i];
        if (!(k in o)) {
            o[k] = Object.create(null);
        }
        o = o[k];
    }
    o[a[a.length - 1]] = v;
}

export function convertToJSONSchemaObject(
    data: Readonly<Record<string, any>>
): Record<string, any> {
    const retObj: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        setPropertyByString(retObj, key, value);
    }

    return retObj;
}

export function formatObject(
    obj: Readonly<Record<string, any>>
): Record<string, any> {
    const clone: Record<string, any> = {};
    const arrayValueKeys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
        clone[key] = formatValue(value, key, obj, arrayValueKeys);
    }
    for (const key of arrayValueKeys) {
        if (key in clone) {
            delete clone[key];
        }
    }
    return clone;
}

import { generateUUID, VJF_ARRAY_ITEM_PREFIX } from '@/Commons.ts';

export function flattenArray(
    data: any[],
    into: Record<string, any>,
    arrayKey: string
) {
    const mappedArray = data.map((item) => ({
        item,
        id: VJF_ARRAY_ITEM_PREFIX + generateUUID(),
    }));
    into[arrayKey] = mappedArray.map((item) => item.id);
    mappedArray.forEach((item) => {
        if (typeof item.item === 'object') {
            flattenData(item.item, into, `${arrayKey}.${item.id}`);
        } else {
            into[`${arrayKey}.${item.id}`] = item.item;
        }
    });
}

export function flattenData(
    data: Record<string, any> | any[],
    into: Record<string, any> = {},
    parentKey = '/properties'
): Record<string, any> {
    if (Array.isArray(data)) {
        flattenArray(data, into, parentKey);
    } else {
        for (const [key, value] of Object.entries(data)) {
            const flatKey = `${parentKey}/${key}`;
            if (Array.isArray(value)) {
                flattenArray(value, into, flatKey);
            } else if (typeof value === 'object' && value !== null) {
                flattenData(value, into, `${flatKey}/properties`);
            } else {
                into[flatKey] = value;
            }
        }
    }
    return into;
}

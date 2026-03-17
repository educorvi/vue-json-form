/* eslint-disable @typescript-eslint/no-explicit-any */
import { isProxy, toRaw } from 'vue';

function readFileDataAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
        try {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result as string);
            };
            reader.readAsDataURL(file);
        } catch {
            console.error('Error reading file', file);
            resolve('');
        }
    });
}

export async function addFilesToFormdata(data: any) {
    if (data instanceof File) {
        return await readFileDataAsDataUrl(data);
    } else if (isProxy(data)) {
        return await addFilesToFormdata(toRaw(data));
    } else if (
        data !== null &&
        (typeof data === 'object' || Array.isArray(data))
    ) {
        for (const [key, value] of Object.entries(data)) {
            data[key] = await addFilesToFormdata(value);
        }
    }

    return data;
}

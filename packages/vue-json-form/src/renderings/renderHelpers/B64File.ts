// Based on https://gist.github.com/akarsh1995/10e4fdc7451c88a71835368864af3b8c

/**
 * Parsed components of a base64-encoded data URL that includes file metadata.
 *
 * The expected data URL format is:
 * `data:{mimeType};name={filename}.{extension};base64,{b64data}`
 *
 * The `name=` segment is optional:
 * `data:{mimeType};base64,{b64data}`
 */
interface IBase64Data {
    /** MIME type of the file (e.g. `"image/png"`, `"text/plain"`). */
    mimeType: string;
    /** File name without extension. URL encoding is decoded. `undefined` when the data URL has no `name=` segment. */
    filename?: string;
    /** File extension without the leading dot (e.g. `"txt"`, `"png"`). `undefined` when the data URL has no `name=` segment. */
    extension?: string;
    /** Raw base64-encoded file content. */
    b64data: string;
}

/**
 * Decodes a base64 string into a `Uint8Array`.
 *
 * @param base64 - A raw base64-encoded string (no data-URL prefix).
 * @returns The decoded bytes as a `Uint8Array`.
 */
function _base64ToArrayBuffer(base64: string): Uint8Array<ArrayBuffer> {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

/**
 * Wraps a base64-encoded data URL that carries file metadata (MIME type, file
 * name, and extension) and provides helpers to convert it back into browser
 * primitives (`Uint8Array`, `Blob`, `File`).
 *
 * The data URL must follow the format produced by {@link Base64String.fromFile}:
 * ```
 * data:{mimeType};name={encodedFilename}.{extension};base64,{b64data}
 * ```
 * The `name=` segment is optional:
 * ```
 * data:{mimeType};base64,{b64data}
 * ```
 *
 * @example
 * ```ts
 * // Round-trip: File → Base64String → File
 * const b64 = await Base64String.fromFile(myFile);
 * const restoredFile = b64.getFile();
 * ```
 */
export class Base64String {
    /** Parsed metadata and raw base64 content. */
    private readonly data: IBase64Data;
    /** The original base64 data URL string passed to the constructor. */
    private readonly b64: string;

    /**
     * @param base64String - A data URL in the format
     *   `data:{mimeType};name={filename}.{extension};base64,{b64data}`.
     * @throws {Error} If `base64String` does not match the expected format.
     */
    constructor(base64String: string) {
        this.b64 = base64String;
        this.data = this.destructure();
    }

    /**
     * Parses {@link b64} into its constituent parts.
     *
     * @returns The parsed {@link IBase64Data} object.
     * @throws {Error} If the stored string does not match the expected pattern.
     */
    private destructure(): IBase64Data {
        // Step 1: Separate the base64 data from the metadata header
        const commaIndex = this.b64.indexOf(',');
        if (commaIndex === -1) throw new Error(`Invalid base64 string`);

        const header = this.b64.slice(0, commaIndex); // e.g. "data:image/png;name=foo.png;base64"
        const b64data = this.b64.slice(commaIndex + 1);

        // Step 2: Split the header into semicolon-delimited segments
        const segments = header.split(';');
        // segments[0] = "data:image/png", last = "base64"

        if (
            !segments[0].startsWith('data:') ||
            segments[segments.length - 1] !== 'base64'
        ) {
            throw new Error(`Invalid base64 string`);
        }

        const mimeType = segments[0].slice('data:'.length);
        if (!mimeType) throw new Error(`Invalid base64 string`);

        // Step 3: Look for the optional "name=..." segment
        const nameSegment = segments.find((s) => s.startsWith('name='));
        if (!nameSegment) {
            return { mimeType, b64data };
        }

        const nameValue = nameSegment.slice('name='.length); // e.g. "foo.png"
        const lastDot = nameValue.lastIndexOf('.');
        const filename =
            lastDot !== -1
                ? decodeURIComponent(nameValue.slice(0, lastDot))
                : decodeURIComponent(nameValue);
        const extension =
            lastDot !== -1 ? nameValue.slice(lastDot + 1) : undefined;

        return { mimeType, filename, extension, b64data };
    }

    /**
     * Returns the file content as a `Uint8Array`.
     */
    getBuffer(): Uint8Array<ArrayBuffer> {
        return _base64ToArrayBuffer(this.data.b64data);
    }

    /**
     * Returns the file content as a `Blob` with the correct MIME type.
     */
    getBlob(): Blob {
        return new Blob([this.getBuffer()], { type: this.data.mimeType });
    }

    private static calculateFileNameWithExtension(
        filename: string | undefined,
        extension: string | undefined
    ): string {
        if (filename !== undefined && extension !== undefined)
            return `${filename}.${extension}`;
        if (filename !== undefined) return filename;
        if (extension !== undefined) return `.${extension}`;
        return '';
    }

    /**
     * Reconstructs the original `File` object from the stored base64 data.
     */
    getFile(): File {
        return new File([this.getBlob()], this.getFileNameWithextension(), {
            type: this.data.mimeType,
        });
    }

    getMimeType(): string {
        return this.data.mimeType;
    }

    /**
     * Returns the file name including its extension (e.g. `"report.pdf"`).
     * Returns an empty string when the data URL contains no `name=` segment.
     */
    getFileNameWithextension(): string {
        const { filename, extension } = this.data;
        return Base64String.calculateFileNameWithExtension(filename, extension);
    }

    getFileName(): string {
        const { filename } = this.data;
        return filename ?? '';
    }

    getExtension(): string {
        const { extension } = this.data;
        return extension ?? '';
    }

    getBase64Data(): string {
        return this.data.b64data;
    }

    getBase64Uri(): string {
        return this.b64;
    }

    equals(b64: Base64String, metadata = true): boolean {
        return Base64String.equals(this, b64, metadata);
    }

    /**
     * Reads a `File` and resolves to a `Base64String` instance that encodes the
     * file's content together with its metadata.
     *
     * @param file - The browser `File` object to encode.
     * @returns A promise that resolves with the resulting `Base64String`.
     * @throws Will reject if the underlying `FileReader` encounters an error.
     */
    static fromFile(file: File): Promise<Base64String> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const b64data = (reader.result as string).split(',')[1];
                const lastDot = file.name.lastIndexOf('.');
                const filename =
                    lastDot !== -1 ? file.name.slice(0, lastDot) : file.name;
                const extension =
                    lastDot !== -1 ? file.name.slice(lastDot + 1) : '';
                const fileNameWithExtension =
                    Base64String.calculateFileNameWithExtension(
                        filename,
                        extension
                    );
                let fileNamePart = '';
                if (fileNameWithExtension) {
                    fileNamePart = `;name=${encodeURIComponent(filename)}.${extension}`;
                }
                const b64string = `data:${file.type}${fileNamePart};base64,${b64data}`;
                resolve(new Base64String(b64string));
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    static equals(a: Base64String, b: Base64String, metadata = true): boolean {
        if (metadata) {
            return (
                a.getMimeType() === b.getMimeType() &&
                a.getFileNameWithextension() === b.getFileNameWithextension() &&
                a.getBase64Data() === b.getBase64Data()
            );
        } else {
            return a.getBase64Data() === b.getBase64Data();
        }
    }
}

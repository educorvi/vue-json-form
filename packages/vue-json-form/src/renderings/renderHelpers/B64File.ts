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
    private destructure() {
        const groups = new RegExp(
            /data:(.*?);(?:(?:.*;)*name=(.*)\.(.*?);(?:.*;)*)?base64,(.*)/
        ).exec(this.b64);
        if (!groups) throw new Error(`Invalid base64 string: ${this.b64}`);
        const [_, mimeType, filename, extension, b64data] = groups;
        return {
            mimeType,
            filename:
                filename != null ? decodeURIComponent(filename) : undefined,
            extension: extension ?? undefined,
            b64data,
        };
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
        if (filename && extension) return `${filename}.${extension}`;
        if (filename) return filename;
        if (extension) return `.${extension}`;
        return '';
    }

    /**
     * Returns the file name including its extension (e.g. `"report.pdf"`).
     * Returns an empty string when the data URL contains no `name=` segment.
     */
    getFileNameWithExtension(): string {
        const { filename, extension } = this.data;
        return Base64String.calculateFileNameWithExtension(filename, extension);
    }

    /**
     * Reconstructs the original `File` object from the stored base64 data.
     */
    getFile(): File {
        return new File([this.getBlob()], this.getFileNameWithExtension(), {
            type: this.data.mimeType,
        });
    }

    getBase64String(): string {
        return this.b64;
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
}

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Base64String } from '@/renderings/renderHelpers';

// "hello" encoded in base64
const HELLO_B64 = 'aGVsbG8=';
const HELLO_BYTES = [104, 101, 108, 108, 111];

/** A valid data URL in the format produced/consumed by Base64String. */
const VALID_URL = `data:text/plain;name=hello.txt;base64,${HELLO_B64}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Stubs the global `FileReader` constructor so that calling `readAsDataURL`
 * asynchronously triggers `onload` (or `onerror` when `shouldError` is true).
 */
function mockFileReader(result: string, shouldError = false) {
    vi.stubGlobal(
        'FileReader',
        // Must use `function` (not an arrow) so `new FileReader()` works and
        // `this` inside refers to the newly created instance.
        function (this: any) {
            this.result = result;
            this.onload = null;
            this.onerror = null;
            this.readAsDataURL = vi.fn().mockImplementation(() => {
                Promise.resolve().then(() => {
                    if (shouldError) {
                        this.onerror?.(new Error('FileReader error'));
                    } else {
                        this.onload?.();
                    }
                });
            });
        }
    );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Base64String', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // -------------------------------------------------------------------------
    describe('constructor / _destructure', () => {
        it('parses mimeType, filename, extension, and b64data from a valid URL', () => {
            const b64 = new Base64String(VALID_URL);
            expect(b64.getMimeType()).toBe('text/plain');
            expect(b64.getFileName()).toBe('hello');
            expect(b64.getExtension()).toBe('txt');
            expect(b64.getBase64Data()).toBe(HELLO_B64);
        });

        it('stores the original string in _b64', () => {
            const b64 = new Base64String(VALID_URL);
            expect(b64.getBase64Uri()).toBe(VALID_URL);
        });

        it('decodes a URL-encoded filename', () => {
            const url = `data:text/plain;name=hello%20world.txt;base64,${HELLO_B64}`;
            const b64 = new Base64String(url);
            expect(b64.getFileName()).toBe('hello world');
        });

        it('handles a sub-type MIME type (e.g. application/pdf)', () => {
            const url = `data:application/pdf;name=report.pdf;base64,${HELLO_B64}`;
            const b64 = new Base64String(url);
            expect(b64.getMimeType()).toBe('application/pdf');
            expect(b64.getExtension()).toBe('pdf');
        });

        it('handles extra semicolon-separated parameters between MIME type and name', () => {
            const url = `data:text/plain;charset=utf-8;name=notes.txt;base64,${HELLO_B64}`;
            const b64 = new Base64String(url);
            expect(b64.getMimeType()).toBe('text/plain');
            expect(b64.getFileName()).toBe('notes');
            expect(b64.getExtension()).toBe('txt');
        });

        it('throws on a plain string that is not a data URL', () => {
            expect(() => new Base64String('not-a-data-url')).toThrow(
                'Invalid base64 string'
            );
        });

        it('throws on an empty string', () => {
            expect(() => new Base64String('')).toThrow('Invalid base64 string');
        });

        it('work with name segment missing', () => {
            const url = `data:text/plain;base64,${HELLO_B64}`;
            expect(new Base64String(url).getBase64Uri()).toBe(
                `data:text/plain;base64,${HELLO_B64}`
            );
        });

        it('throws when the base64 segment is missing', () => {
            const url = 'data:text/plain;name=hello.txt';
            expect(() => new Base64String(url)).toThrow(
                'Invalid base64 string'
            );
        });
    });

    // -------------------------------------------------------------------------
    describe('getBuffer', () => {
        it('returns a Uint8Array', () => {
            const b64 = new Base64String(VALID_URL);
            expect(b64.getBuffer()).toBeInstanceOf(Uint8Array);
        });

        it('decodes the base64 data to the correct bytes', () => {
            const b64 = new Base64String(VALID_URL);
            expect(Array.from(b64.getBuffer())).toEqual(HELLO_BYTES);
        });

        it('returns an empty Uint8Array for empty base64 content', () => {
            const url = 'data:text/plain;name=empty.txt;base64,';
            const b64 = new Base64String(url);
            expect(b64.getBuffer().length).toBe(0);
        });
    });

    // -------------------------------------------------------------------------
    describe('getBlob', () => {
        it('returns a Blob instance', () => {
            expect(new Base64String(VALID_URL).getBlob()).toBeInstanceOf(Blob);
        });

        it('sets the correct MIME type on the Blob', () => {
            expect(new Base64String(VALID_URL).getBlob().type).toBe(
                'text/plain'
            );
        });

        it('produces a Blob whose size matches the decoded byte count', () => {
            // "hello" is 5 bytes
            expect(new Base64String(VALID_URL).getBlob().size).toBe(5);
        });
    });

    // -------------------------------------------------------------------------
    describe('getFileNameWithextension', () => {
        it('returns filename.extension', () => {
            expect(new Base64String(VALID_URL).getFileNameExtension()).toBe(
                'hello.txt'
            );
        });

        it('handles a URL-encoded filename with spaces', () => {
            const url = `data:text/plain;name=my%20file.csv;base64,${HELLO_B64}`;
            expect(new Base64String(url).getFileNameExtension()).toBe(
                'my file.csv'
            );
        });

        it('joins with a dot even when extension is empty', () => {
            const url = `data:application/octet-stream;name=noext.;base64,${HELLO_B64}`;
            expect(new Base64String(url).getFileNameExtension()).toBe('noext.');
        });
    });

    // -------------------------------------------------------------------------
    describe('getFile', () => {
        it('returns a File instance', () => {
            expect(new Base64String(VALID_URL).getFile()).toBeInstanceOf(File);
        });

        it('sets the correct file name (including extension)', () => {
            expect(new Base64String(VALID_URL).getFile().name).toBe(
                'hello.txt'
            );
        });

        it('sets the correct MIME type on the File', () => {
            expect(new Base64String(VALID_URL).getFile().type).toBe(
                'text/plain'
            );
        });

        it('produces a File whose size matches the decoded byte count', () => {
            expect(new Base64String(VALID_URL).getFile().size).toBe(5);
        });
    });

    // -------------------------------------------------------------------------
    describe('fromFile', () => {
        it('resolves with correct metadata for a file that has an extension', async () => {
            const file = new File(['hello'], 'hello.txt', {
                type: 'text/plain',
            });
            mockFileReader(`data:text/plain;base64,${HELLO_B64}`);

            const b64 = await Base64String.fromFile(file);
            expect(b64.getMimeType()).toBe('text/plain');
            expect(b64.getFileName()).toBe('hello');
            expect(b64.getExtension()).toBe('txt');
            expect(b64.getBase64Data()).toBe(HELLO_B64);
        });

        it('resolves correctly for a file without an extension', async () => {
            const file = new File(['hello'], 'README', { type: 'text/plain' });
            mockFileReader(`data:text/plain;base64,${HELLO_B64}`);

            const b64 = await Base64String.fromFile(file);
            expect(b64.getFileName()).toBe('README');
            expect(b64.getExtension()).toBe('');
        });

        it('URL-encodes special characters in the filename', async () => {
            const file = new File(['hello'], 'my file.txt', {
                type: 'text/plain',
            });
            mockFileReader(`data:text/plain;base64,${HELLO_B64}`);

            const b64 = await Base64String.fromFile(file);
            // After round-tripping through encodeURIComponent / decodeURIComponent
            // the filename must be restored to its original value.
            expect(b64.getFileName()).toBe('my file');
        });

        it('rejects when FileReader fires an error', async () => {
            const file = new File(['hello'], 'hello.txt', {
                type: 'text/plain',
            });
            mockFileReader('', /* shouldError */ true);

            await expect(Base64String.fromFile(file)).rejects.toThrow(
                'FileReader error'
            );
        });

        it('produced Base64String round-trips back to a valid File', async () => {
            const original = new File(['hello'], 'hello.txt', {
                type: 'text/plain',
            });
            mockFileReader(`data:text/plain;base64,${HELLO_B64}`);

            const b64 = await Base64String.fromFile(original);
            const restored = b64.getFile();

            expect(restored.name).toBe('hello.txt');
            expect(restored.type).toBe('text/plain');
            expect(restored.size).toBe(5);
        });
    });
});

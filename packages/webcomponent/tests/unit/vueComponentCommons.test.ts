import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
    type Mock,
} from 'vitest';
import type { SubmitOptions } from '@educorvi/vue-json-form-schemas';
import {
    getSubmitFunc,
    getComputed,
    type Props,
    type Emits,
} from '../../src/vueComponentCommons';
import axios from 'axios';

vi.mock('axios');

describe('vueComponentCommons', () => {
    let mockEmit: Mock;

    beforeEach(() => {
        mockEmit = vi.fn();
        vi.clearAllMocks();

        // Mock window.location.href by spying on it
        delete (window as any).location;
        (window as any).location = { href: '' };
    });

    afterEach(() => {
        // Restore window.location
        vi.restoreAllMocks();
    });

    describe('getSubmitFunc', () => {
        it('should return a function', () => {
            const submitFunc = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            expect(typeof submitFunc).toBe('function');
        });

        it('should return an async function', async () => {
            const submitFunc = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const result = submitFunc({}, { action: 'emit' });
            expect(result instanceof Promise).toBe(true);
        });
    });

    describe('onSubmitForm - emit action', () => {
        it('should emit submit event when action is not "request"', async () => {
            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John', age: 30 };
            const options: SubmitOptions = { action: 'emit' };

            await onSubmitForm(data, options);

            expect(mockEmit).toHaveBeenCalledWith('submit', data, options);
        });

        it('should emit submitSucceeded event after successful emit action', async () => {
            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John', age: 30 };
            const options: SubmitOptions = { action: 'emit' };

            await onSubmitForm(data, options);

            expect(mockEmit).toHaveBeenCalledWith(
                'submitSucceeded',
                data,
                options
            );
        });

        it('should emit afterSubmitted event after successful emit action', async () => {
            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John', age: 30 };
            const options: SubmitOptions = { action: 'emit' };

            await onSubmitForm(data, options);

            expect(mockEmit).toHaveBeenCalledWith(
                'afterSubmitted',
                data,
                options
            );
        });

        it('should emit events in correct order for emit action', async () => {
            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = { action: 'emit' };

            await onSubmitForm(data, options);

            expect(mockEmit.mock.calls).toEqual([
                ['submit', data, options],
                ['submitSucceeded', data, options],
                ['afterSubmitted', data, options],
            ]);
        });

        it('should not emit submitFailed event for successful emit action', async () => {
            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = { action: 'emit' };

            await onSubmitForm(data, options);

            expect(mockEmit).not.toHaveBeenCalledWith(
                expect.stringContaining('submitFailed'),
                expect.anything(),
                expect.anything()
            );
        });
    });

    describe('onSubmitForm - single URL request', () => {
        it('should make axios request with single URL', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                },
            };

            await onSubmitForm(data, options);

            expect(mockedAxios).toHaveBeenCalledWith(
                'https://api.example.com/submit',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    data,
                })
            );
        });

        it('should emit submitSucceeded after successful single URL request', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'POST',
                },
            };

            await onSubmitForm(data, options);

            expect(mockEmit).toHaveBeenCalledWith(
                'submitSucceeded',
                data,
                options
            );
        });

        it('should emit submitFailed when single URL request fails', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockRejectedValueOnce(new Error('Network error'));

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'POST',
                },
            };

            await onSubmitForm(data, options);

            expect(mockEmit).toHaveBeenCalledWith(
                'submitFailed',
                data,
                options
            );
        });

        it('should not emit submitSucceeded when single URL request fails', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockRejectedValueOnce(new Error('Network error'));
            const consoleErrorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'POST',
                },
            };

            await onSubmitForm(data, options);

            expect(mockEmit).not.toHaveBeenCalledWith(
                'submitSucceeded',
                expect.anything(),
                expect.anything()
            );
            consoleErrorSpy.mockRestore();
        });
    });

    describe('onSubmitForm - multiple URL requests', () => {
        it('should make axios requests for each URL in array', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const urls = [
                'https://api.example.com/submit1',
                'https://api.example.com/submit2',
            ];
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: urls,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                },
            };

            await onSubmitForm(data, options);

            expect(mockedAxios).toHaveBeenCalledTimes(2);
            expect(mockedAxios).toHaveBeenNthCalledWith(
                1,
                urls[0],
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    data,
                })
            );
            expect(mockedAxios).toHaveBeenNthCalledWith(
                2,
                urls[1],
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    data,
                })
            );
        });

        it('should emit submitSucceeded after all URLs requested successfully', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: [
                        'https://api.example.com/submit1',
                        'https://api.example.com/submit2',
                    ],
                    method: 'POST',
                },
            };

            await onSubmitForm(data, options);

            expect(mockEmit).toHaveBeenCalledWith(
                'submitSucceeded',
                data,
                options
            );
        });

        it('should stop processing URLs after first failure', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});
            mockedAxios.mockRejectedValueOnce(
                new Error('Second request failed')
            );

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: [
                        'https://api.example.com/submit1',
                        'https://api.example.com/submit2',
                        'https://api.example.com/submit3',
                    ],
                    method: 'POST',
                },
            };

            const consoleErrorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            await onSubmitForm(data, options);
            consoleErrorSpy.mockRestore();

            // Should only call first two URLs before breaking
            expect(mockedAxios).toHaveBeenCalledTimes(2);
        });

        it('should emit submitFailed after first URL fails in array', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});
            mockedAxios.mockRejectedValueOnce(
                new Error('Second request failed')
            );
            const consoleErrorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: [
                        'https://api.example.com/submit1',
                        'https://api.example.com/submit2',
                    ],
                    method: 'POST',
                },
            };

            await onSubmitForm(data, options);

            expect(mockEmit).toHaveBeenCalledWith(
                'submitFailed',
                data,
                options
            );
            consoleErrorSpy.mockRestore();
        });
    });

    describe('onSubmitForm - redirect on success', () => {
        it('should redirect when onSuccessRedirect is provided and request succeeds', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const redirectUrl = 'https://example.com/success';
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'POST',
                    onSuccessRedirect: redirectUrl,
                },
            };

            await onSubmitForm(data, options);

            expect(window.location.href).toBe(redirectUrl);
        });

        it('should not redirect when request fails', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockRejectedValueOnce(new Error('Request failed'));
            const consoleErrorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const redirectUrl = 'https://example.com/success';
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'POST',
                    onSuccessRedirect: redirectUrl,
                },
            };

            await onSubmitForm(data, options);

            expect(window.location.href).toBe('');
            consoleErrorSpy.mockRestore();
        });

        it('should redirect even after multiple successful URL requests', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const redirectUrl = 'https://example.com/success';
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: [
                        'https://api.example.com/submit1',
                        'https://api.example.com/submit2',
                    ],
                    method: 'POST',
                    onSuccessRedirect: redirectUrl,
                },
            };

            await onSubmitForm(data, options);

            expect(window.location.href).toBe(redirectUrl);
        });
    });

    describe('onSubmitForm - event emission order', () => {
        it('should emit events in correct order for successful request', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'POST',
                },
            };

            await onSubmitForm(data, options);

            expect(mockEmit.mock.calls).toEqual([
                ['submitSucceeded', data, options],
                ['afterSubmitted', data, options],
            ]);
        });

        it('should emit events in correct order for failed request', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockRejectedValueOnce(new Error('Request failed'));
            const consoleErrorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'POST',
                },
            };

            await onSubmitForm(data, options);

            expect(mockEmit.mock.calls).toEqual([
                ['submitFailed', data, options],
                ['afterSubmitted', data, options],
            ]);
            consoleErrorSpy.mockRestore();
        });
    });

    describe('onSubmitForm - edge cases', () => {
        it('should handle undefined URL gracefully', async () => {
            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: undefined,
                    method: 'POST',
                },
            };

            await onSubmitForm(data, options);

            expect(mockEmit).toHaveBeenCalledWith(
                'submitSucceeded',
                data,
                options
            );
            expect(vi.mocked(axios)).not.toHaveBeenCalled();
        });

        it('should handle empty URL array', async () => {
            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: [],
                    method: 'POST',
                },
            };

            await onSubmitForm(data, options);

            expect(mockEmit).toHaveBeenCalledWith(
                'submitSucceeded',
                data,
                options
            );
            expect(vi.mocked(axios)).not.toHaveBeenCalled();
        });

        it('should handle undefined request object', async () => {
            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: undefined,
            };

            await onSubmitForm(data, options);

            expect(mockEmit).toHaveBeenCalledWith(
                'submitSucceeded',
                data,
                options
            );
            expect(vi.mocked(axios)).not.toHaveBeenCalled();
        });

        it('should handle various HTTP methods', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'PUT',
                },
            };

            await onSubmitForm(data, options);

            expect(mockedAxios).toHaveBeenCalledWith(
                'https://api.example.com/submit',
                expect.objectContaining({
                    method: 'PUT',
                })
            );
        });

        it('should default to POST', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                },
            };

            await onSubmitForm(data, options);

            expect(mockedAxios).toHaveBeenCalledWith(
                'https://api.example.com/submit',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('should handle custom headers', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = { name: 'John' };
            const customHeaders = {
                Authorization: 'Bearer token123',
                'X-Custom-Header': 'custom-value',
            };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'POST',
                    headers: customHeaders,
                },
            };

            await onSubmitForm(data, options);

            expect(mockedAxios).toHaveBeenCalledWith(
                'https://api.example.com/submit',
                expect.objectContaining({
                    headers: customHeaders,
                })
            );
        });

        it('should handle complex data structures', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = {
                name: 'John',
                nested: {
                    field: 'value',
                    array: [1, 2, 3],
                },
                tags: ['tag1', 'tag2'],
            };
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'POST',
                },
            };

            await onSubmitForm(data, options);

            expect(mockedAxios).toHaveBeenCalledWith(
                'https://api.example.com/submit',
                expect.objectContaining({
                    data,
                })
            );
        });

        it('should handle empty data object', async () => {
            const mockedAxios = vi.mocked(axios);
            mockedAxios.mockResolvedValueOnce({});

            const onSubmitForm = getSubmitFunc(
                mockEmit as Emits,
                null
            );
            const data = {};
            const options: SubmitOptions = {
                action: 'request',
                request: {
                    url: 'https://api.example.com/submit',
                    method: 'POST',
                },
            };

            await onSubmitForm(data, options);

            expect(mockedAxios).toHaveBeenCalledWith(
                'https://api.example.com/submit',
                expect.objectContaining({
                    data,
                })
            );
        });
    });

    describe('getComputed', () => {
        it('should parse valid JSON Schema', () => {
            const props: Props = {
                jsonSchema:
                    '{"type":"object","properties":{"name":{"type":"string"}}}',
            };

            const computed = getComputed(props);
            expect(computed.jsonSchema.value).toEqual({
                type: 'object',
                properties: {
                    name: { type: 'string' },
                },
            });
        });

        it('should return undefined for invalid JSON Schema with warning', () => {
            const consoleWarnSpy = vi
                .spyOn(console, 'warn')
                .mockImplementation(() => {});
            const props: Props = {
                jsonSchema: 'invalid json',
            };

            const computed = getComputed(props);
            expect(computed.jsonSchema.value).toBeUndefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Could not parse JSON Schema',
                expect.any(Error)
            );

            consoleWarnSpy.mockRestore();
        });

        it('should parse valid UI Schema', () => {
            const props: Props = {
                jsonSchema: '{}',
                uiSchema: '{"type":"VerticalLayout","elements":[]}',
            };

            const computed = getComputed(props);
            expect(computed.uiSchema.value).toEqual({
                type: 'VerticalLayout',
                elements: [],
            });
        });

        it('should return undefined for missing UI Schema', () => {
            const props: Props = {
                jsonSchema: '{}',
            };

            const computed = getComputed(props);
            expect(computed.uiSchema.value).toBeUndefined();
        });

        it('should return undefined for invalid UI Schema with warning', () => {
            const consoleWarnSpy = vi
                .spyOn(console, 'warn')
                .mockImplementation(() => {});
            const props: Props = {
                jsonSchema: '{}',
                uiSchema: 'invalid ui schema',
            };

            const computed = getComputed(props);
            expect(computed.uiSchema.value).toBeUndefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Could not parse UI Schema',
                expect.any(Error)
            );

            consoleWarnSpy.mockRestore();
        });

        it('should parse valid preset data', () => {
            const props: Props = {
                jsonSchema: '{}',
                presetData: '{"name":"John","age":30}',
            };

            const computed = getComputed(props);
            expect(computed.presetData.value).toEqual({
                name: 'John',
                age: 30,
            });
        });

        it('should return undefined for missing preset data', () => {
            const props: Props = {
                jsonSchema: '{}',
            };

            const computed = getComputed(props);
            expect(computed.presetData.value).toBeUndefined();
        });

        it('should return undefined for invalid preset data with warning', () => {
            const consoleWarnSpy = vi
                .spyOn(console, 'warn')
                .mockImplementation(() => {});
            const props: Props = {
                jsonSchema: '{}',
                presetData: 'invalid preset data',
            };

            const computed = getComputed(props);
            expect(computed.presetData.value).toBeUndefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Could not parse pre-set data',
                expect.any(Error)
            );

            consoleWarnSpy.mockRestore();
        });

        it('should handle returnDataAsScopes true boolean', () => {
            const props: Props = {
                jsonSchema: '{}',
                returnDataAsScopes: true,
            };

            const computed = getComputed(props);
            expect(computed.returnDataAsScopes.value).toBe(true);
        });

        it('should handle returnDataAsScopes false boolean', () => {
            const props: Props = {
                jsonSchema: '{}',
                returnDataAsScopes: false,
            };

            const computed = getComputed(props);
            expect(computed.returnDataAsScopes.value).toBe(false);
        });

        it('should handle returnDataAsScopes "true" string', () => {
            const props: Props = {
                jsonSchema: '{}',
                returnDataAsScopes: 'true',
            };

            const computed = getComputed(props);
            expect(computed.returnDataAsScopes.value).toBe(true);
        });

        it('should handle returnDataAsScopes "false" string', () => {
            const props: Props = {
                jsonSchema: '{}',
                returnDataAsScopes: 'false',
            };

            const computed = getComputed(props);
            expect(computed.returnDataAsScopes.value).toBe(false);
        });

        it('should handle returnDataAsScopes undefined', () => {
            const props: Props = {
                jsonSchema: '{}',
            };

            const computed = getComputed(props);
            expect(computed.returnDataAsScopes.value).toBe(false);
        });
    });
});

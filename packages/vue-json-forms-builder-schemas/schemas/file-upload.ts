import { z } from 'zod';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from './form-element';
import type { SchemaGenerator } from './schema-generator';
import { PartialBy } from './base';
import { cleanUiSchema } from './utils';

/** Accepted file types (extension list, same as the renderer). */
export enum FileType {
    pdf = 'pdf', // "application/pdf"
    jpeg = 'jpeg', // "image/jpeg"
    png = 'png', // "image/png"
    tif = 'tif', // "image/tiff"
    gif = 'gif', // "image/gif"
    heic = 'heic', // "image/heic"
    heif = 'heif', // "image/heif"
    doc = 'doc', // "application/msword"
    docx = 'docx', // "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    xls = 'xls', // "application/vnd.ms-excel"
    xlsx = 'xlsx', // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ppt = 'ppt', // "application/vnd.ms-powerpoint"
    pptx = 'pptx', // "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    txt = 'txt', // "text/plain"
    xml = 'xml', // "application/xml"
    json = 'json', // "application/json"
    csv = 'csv', // "text/csv"
    zip = 'zip', // "application/zip"
    rar = 'rar', // "application/x-rar-compressed"
    odt = 'odt', // "application/vnd.oasis.opendocument.text"
    ods = 'ods', // "application/vnd.oasis.opendocument.spreadsheet"
    odp = 'odp', // "application/vnd.oasis.opendocument.presentation"
    odg = 'odg', // "application/vnd.oasis.opendocument.graphics"
    pages = 'pages', // "application/vnd.apple.pages"
    numbers = 'numbers', // "application/vnd.apple.numbers"
    keynote = 'keynote', // "application/vnd.apple.keynote"
}

const FileTypeEnum = z.enum(FileType);

type FileuploadElementData = z.infer<typeof FileuploadElement.schema>;
const fileuploadElementDefaults = {
    type: 'file-upload' as const,
    multiUpload: false,
    displayAsSingleUploadField: false,
};
type FileuploadElementOptionalKeys =
    keyof typeof fileuploadElementDefaults | SimpleElementOptionalKeys;

/** File upload — the form data value is a file URL/array of file URLs. */
export class FileuploadElement extends SimpleElement {
    data: FileuploadElementData;

    static schema = SimpleElement.schema
        .extend({
            type: z.literal('file-upload'),
            multiUpload: z.boolean(),
            minItems: z.number().int().nonnegative().optional(),
            maxItems: z.number().int().nonnegative().optional(),
            acceptedFileType: z.array(FileTypeEnum).optional(),
            maxFileSizeInMB: z.number().int().nonnegative().optional(),
            displayAsSingleUploadField: z
                .boolean()
                .describe('This option only applies when multiUpload is true'),
        })
        .superRefine((data, ctx) => {
            if (
                data.minItems !== undefined &&
                data.maxItems !== undefined &&
                data.minItems > data.maxItems
            ) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'minItems cannot be greater than maxItems',
                    value: data,
                });
            }
            if (data.multiUpload === false) {
                if (data.minItems !== undefined && data.minItems > 1) {
                    ctx.addIssue({
                        code: 'custom',
                        message:
                            'minItems cannot be greater than 1 when multiUpload is false',
                        value: data,
                    });
                }
                if (data.maxItems !== undefined && data.maxItems > 1) {
                    ctx.addIssue({
                        code: 'custom',
                        message:
                            'maxItems cannot be greater than 1 when multiUpload is false',
                        value: data,
                    });
                }
            }
        });

    constructor(
        data: Omit<
            PartialBy<FileuploadElementData, FileuploadElementOptionalKeys>,
            'type'
        >
    ) {
        super(data);
        this.data = FileuploadElement.setDefaults(data);
    }

    protected static setDefaults(
        data: PartialBy<FileuploadElementData, FileuploadElementOptionalKeys>
    ): FileuploadElementData {
        return {
            ...super.setDefaults(data),
            ...fileuploadElementDefaults,
            ...data,
        };
    }

    get multiUpload(): boolean {
        return this.data.multiUpload;
    }

    get displayAsSingleUploadField(): boolean {
        return this.data.displayAsSingleUploadField;
    }

    get minItems(): number | undefined {
        return this.data.minItems;
    }

    get maxItems(): number | undefined {
        return this.data.maxItems;
    }

    get acceptedFileType(): FileType[] | undefined {
        return this.data.acceptedFileType;
    }

    get maxFileSizeInMB(): number | undefined {
        return this.data.maxFileSizeInMB;
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        const uiSchema = super.toUiSchema(_generator, _scope);
        uiSchema.options = {
            ...(uiSchema.options && { ...uiSchema.options }),
            ...(this.displayAsSingleUploadField && {
                displayAsSingleUploadField: this.displayAsSingleUploadField,
            }),
            ...(this.acceptedFileType
                ? { acceptedFileType: this.acceptedFileType }
                : { acceptedFileType: '*' }),
            ...(this.maxFileSizeInMB !== undefined && {
                maxFileSize: this.maxFileSizeInMB * 1024 * 1024,
            }), // convert MB to bytes
        };
        cleanUiSchema(uiSchema);
        return uiSchema;
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        const jsonSchema: JSONSchema = {
            ...super.toJsonSchema(_generator, _scope),
            ...(this.minItems !== undefined && { minItems: this.minItems }),
            ...(this.maxItems !== undefined && { maxItems: this.maxItems }),
        };

        if (this.required) {
            jsonSchema.minItems = Math.max(1, this.minItems ?? 0);
        }

        if (!this.multiUpload) {
            jsonSchema.type = 'string';
            jsonSchema.format = 'uri';
        } else {
            jsonSchema.type = 'array';
            jsonSchema.items = {
                type: 'string',
                format: 'uri',
            };
        }

        return jsonSchema;
    }

    static fromJsonSchemaAndUiSchema(
        id: string,
        jsonSchema: JSONSchema = {},
        _uiSchema: Control,
        required: boolean = false
    ): FileuploadElement {
        const isArray = jsonSchema.type === 'array';
        return new FileuploadElement({
            title: jsonSchema.title ? String(jsonSchema.title) : '',
            description: jsonSchema.description,
            id: id,
            required: required,
            multiUpload: isArray,
            minItems: jsonSchema.minItems,
            maxItems: jsonSchema.maxItems,
        });
    }
}

import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { SimpleElement, SimpleElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { PartialBy } from "./base";
import { createShowOnProperty } from "./children-schema-utils";


enum FileType {
    pdf = "pdf",            // "application/pdf"
    jpeg = "jpeg",          // "image/jpeg"
    png = "png",            // "image/png"
    tif = "tif",            // "image/tiff"
    gif = "gif",            // "image/gif"
    heic = "heic",          // "image/heic"
    heif = "heif",          // "image/heif"
    doc = "doc",            // "application/msword"
    docx = "docx",          // "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    xls = "xls",            // "application/vnd.ms-excel"
    xlsx = "xlsx",          // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ppt = "ppt",            // "application/vnd.ms-powerpoint"
    pptx = "pptx",          // "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    txt = "txt",            // "text/plain"
    xml = "xml",            // "application/xml"
    json = "json",          // "application/json"
    csv = "csv",            // "text/csv"
    zip = "zip",            // "application/zip"
    rar = "rar",            // "application/x-rar-compressed"
    odt = "odt",            // "application/vnd.oasis.opendocument.text"
    ods = "ods",            // "application/vnd.oasis.opendocument.spreadsheet"
    odp = "odp",            // "application/vnd.oasis.opendocument.presentation"
    odg = "odg",            // "application/vnd.oasis.opendocument.graphics"
    pages = "pages",        // "application/vnd.apple.pages"
    numbers = "numbers",    // "application/vnd.apple.numbers"
    keynote = "keynote",    // "application/vnd.apple.keynote"
}


type FileuploadElementData = z.infer<typeof FileuploadElement.schema>;
const fileuploadElementDefaults = {type: "file-upload" as const};
type FileuploadElementOptionalKeys = keyof typeof fileuploadElementDefaults | SimpleElementOptionalKeys;
export class FileuploadElement extends SimpleElement {
    data: FileuploadElementData;

    static schema = SimpleElement.schema.extend({
        type: z.literal("file-upload"),
        minItems: z.number().int().nonnegative().optional(),
        maxItems: z.number().int().nonnegative().optional(),
        possibleFileTypes: z.array(z.enum(FileType)).optional(),
        maxFileSizeInBytes: z.number().int().nonnegative().optional(),
        // displayAsArray: z.boolean()
    });

    constructor(
        data: Omit<PartialBy<FileuploadElementData, FileuploadElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = FileuploadElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<FileuploadElementData, FileuploadElementOptionalKeys>): FileuploadElementData {
        return {
            ...super.setDefaults(data),
            ...fileuploadElementDefaults,
            ...data,
        };
    }

    get minItems(): number | undefined {
        return this.data.minItems;
    }

    get maxItems(): number | undefined {
        return this.data.maxItems;
    }

    get possibleFileTypes(): FileType[] | undefined {
        return this.data.possibleFileTypes;
    }

    get maxFileSizeInBytes(): number | undefined {
        return this.data.maxFileSizeInBytes;
    }

    toUiSchema(_generator: SchemaGenerator, _scope: string[]): Control {
        // TODO
    }

    toJsonSchema(_generator: SchemaGenerator, _scope: string[]): JSONSchema {
        // TODO
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema={}, uiSchema: Control): FileuploadElement {
        // TODO
    }
}


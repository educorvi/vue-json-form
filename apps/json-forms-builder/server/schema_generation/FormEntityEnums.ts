enum Layouts {
    Horizontal = "horizontal",
    Vertical = "vertical",
    Group = "group" // with line to the right of the elements
}

enum StringFormats {
    Text = "text",
    TextArea = "text-area",
    Email = "email",
    Password = "password",
    Date = "date",
    DateTime = "date-time",
    Time = "time",
    Uri = "uri",
    Phone = "phone",
    Color = "color",
    Search = "search",
}

enum NumberFormats {
    Integer = "integer",
    Number = "number", // float
}

enum BooleanFormats {
    Checkbox = "checkbox",
    Switch = "switch"
}

enum EnumFormats {
    Select = "select",
    Radio = "radio"
}

enum ButtonSubmitActions {
    Request = "request",
    Save = "save",
    Print = "print",
}

enum HttpsMethods {
    Get = "GET",
    Post = "POST",
    Put = "PUT",
    Delete = "DELETE",
    // Patch = "PATCH"
}

enum ButtonVariants {
    Primary = "primary",
    Secondary = "secondary",
    Success = "success",
    Danger = "danger",
    Warning = "warning",
    Info = "info",
    Light = "light",
    Dark = "dark",
    // TODO
}

enum ModalSizes {
    Small = "small",
    Medium = "medium",
    Large = "large",
    XLarge = "x-large"
}

enum FileTypes {
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

enum DependencyTypes {
    greaterThan = "greaterThan",
    lessThan = "lessThan",
    equalTo = "equalTo",
    notEqualTo = "notEqualTo",
    greaterThanOrEqualTo = "greaterThanOrEqualTo",
    lessThanOrEqualTo = "lessThanOrEqualTo",
    minLengthOf = "minLengthOf",
    maxLengthOf = "maxLengthOf",
    contains = "contains",
    notContains = "notContains",
    startsWith = "startsWith",
    endsWith = "endsWith",
    isEmpty = "isEmpty",
    isNotEmpty = "isNotEmpty",
}

enum DependencyRelation {
    AND = "AND",
    OR = "OR"
}

export { Layouts, StringFormats, BooleanFormats, EnumFormats, ButtonSubmitActions, HttpsMethods, ButtonVariants, ModalSizes, FileTypes, DependencyTypes, DependencyRelation, NumberFormats };
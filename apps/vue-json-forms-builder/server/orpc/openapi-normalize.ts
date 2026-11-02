export type OpenApiValue =
    OpenApiObject | OpenApiValue[] | string | number | boolean | null;
export type OpenApiObject = { [key: string]: OpenApiValue };

export function deduplicateOpenApiDocument(
    document: OpenApiObject
): OpenApiObject {
    const components = isOpenApiObject(document.components)
        ? document.components
        : {};
    const schemas = isOpenApiObject(components.schemas)
        ? components.schemas
        : {};
    const responses = isOpenApiObject(components.responses)
        ? components.responses
        : {};
    const parameters = isOpenApiObject(components.parameters)
        ? components.parameters
        : {};

    const schemaGroups = new Map<string, string[]>();
    for (const [name, schema] of Object.entries(schemas)) {
        if (!isOpenApiObject(schema) || '$ref' in schema) continue;
        const key = canonicalJson(schema);
        const group = schemaGroups.get(key) ?? [];
        group.push(name);
        schemaGroups.set(key, group);
    }

    for (const names of schemaGroups.values()) {
        if (names.length < 2) continue;
        const canonicalName = names[0]!;
        for (const name of names.slice(1)) {
            schemas[name] = {
                $ref: `#/components/schemas/${canonicalName}`,
            };
        }
    }

    const responseOccurrences: ReusableObjectOccurrence[] = [];
    const parameterOccurrences: ReusableObjectOccurrence[] = [];
    const paths = isOpenApiObject(document.paths) ? document.paths : {};

    for (const pathItem of Object.values(paths)) {
        if (!isOpenApiObject(pathItem)) continue;
        for (const operation of Object.values(pathItem)) {
            if (!isOpenApiObject(operation)) continue;

            if (isOpenApiObject(operation.responses)) {
                for (const [status, response] of Object.entries(
                    operation.responses
                )) {
                    if (!isOpenApiObject(response) || '$ref' in response) {
                        continue;
                    }
                    if (status === '204') {
                        delete response.content;
                        response.description = 'No Content';
                    }
                    responseOccurrences.push({
                        value: response,
                        replace: (reference) => {
                            (operation.responses as OpenApiObject)[status] =
                                reference;
                        },
                    });
                }
            }

            if (Array.isArray(operation.parameters)) {
                operation.parameters.forEach((parameter, index) => {
                    if (!isOpenApiObject(parameter) || '$ref' in parameter) {
                        return;
                    }
                    parameterOccurrences.push({
                        value: parameter,
                        replace: (reference) => {
                            (operation.parameters as OpenApiValue[])[index] =
                                reference;
                        },
                    });
                });
            }
        }
    }

    hoistRepeatedObjects(
        responseOccurrences,
        responses,
        'GeneratedResponse',
        'responses'
    );
    hoistRepeatedObjects(
        parameterOccurrences,
        parameters,
        'GeneratedParameter',
        'parameters'
    );

    document.components = {
        ...components,
        schemas,
        responses,
        parameters,
    };

    return document;
}

type ReusableObjectOccurrence = {
    value: OpenApiObject;
    replace: (reference: OpenApiObject) => void;
};

function hoistRepeatedObjects(
    occurrences: ReusableObjectOccurrence[],
    components: OpenApiObject,
    namePrefix: string,
    componentPath: string
): void {
    const groups = new Map<string, ReusableObjectOccurrence[]>();
    for (const occurrence of occurrences) {
        const key = canonicalJson(occurrence.value);
        const group = groups.get(key) ?? [];
        group.push(occurrence);
        groups.set(key, group);
    }

    let index = 1;
    for (const group of groups.values()) {
        if (group.length < 2) continue;
        let name = `${namePrefix}${index++}`;
        while (name in components) name = `${namePrefix}${index++}`;
        components[name] = group[0]!.value;

        const reference = { $ref: `#/components/${componentPath}/${name}` };
        for (const occurrence of group) occurrence.replace(reference);
    }
}

function canonicalJson(value: OpenApiValue): string {
    if (Array.isArray(value)) {
        return `[${value.map(canonicalJson).join(',')}]`;
    }
    if (isOpenApiObject(value)) {
        return `{${Object.keys(value)
            .sort()
            .map(
                (key) => `${JSON.stringify(key)}:${canonicalJson(value[key]!)}`
            )
            .join(',')}}`;
    }
    return JSON.stringify(value) ?? 'undefined';
}

function isOpenApiObject(
    value: OpenApiValue | undefined
): value is OpenApiObject {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

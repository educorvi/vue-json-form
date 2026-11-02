import type { OpenAPI } from '@orpc/contract';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import { schemaConverters, specGenerateOptions } from './openapi-spec';

const docsConfig = {
    authentication: {
        securitySchemes: {
            BearerAuth: {
                token: 'default-token',
            },
        },
    },
};

type RenderDocsHtml = (
    specUrl: string,
    title: string,
    head: string,
    scriptUrl: string,
    config: Record<string, unknown> | undefined,
    spec: OpenAPI.Document,
    docsProvider: 'scalar' | 'swagger',
    cssUrl: string | undefined
) => string;

function createReferencePlugin(
    docsProvider: 'scalar' | 'swagger',
    docsPath: `/${string}`,
    specPath: `/${string}`,
    renderDocsHtml: RenderDocsHtml
) {
    return new OpenAPIReferencePlugin({
        docsProvider,
        docsPath,
        specPath,
        schemaConverters,
        specGenerateOptions,
        docsConfig,
        renderDocsHtml,
    });
}

export function createScalarReferencePlugin(
    docsPath: `/${string}`,
    specPath: `/${string}`
) {
    return createReferencePlugin(
        'scalar',
        docsPath,
        specPath,
        renderScalarDocsHtml
    );
}

export function createSwaggerReferencePlugin(
    docsPath: `/${string}`,
    specPath: `/${string}`
) {
    return createReferencePlugin(
        'swagger',
        docsPath,
        specPath,
        renderSwaggerDocsHtml
    );
}

const renderScalarDocsHtml: RenderDocsHtml = (
    specUrl,
    title,
    head,
    scriptUrl,
    config,
    _spec,
    _provider,
    cssUrl
) => {
    const scalarConfig = serializeConfig({ url: specUrl, ...config });
    const script = `Scalar.createApiReference('#app', ${scalarConfig});`;

    return renderDocsHtmlShell(title, head, scriptUrl, cssUrl, script);
};

const renderSwaggerDocsHtml: RenderDocsHtml = (
    specUrl,
    title,
    head,
    scriptUrl,
    config,
    _spec,
    _provider,
    cssUrl
) => {
    const swaggerConfig = serializeConfig({
        dom_id: '#app',
        url: specUrl,
        deepLinking: true,
        presets: [
            'SwaggerUIBundle.presets.apis',
            'SwaggerUIBundle.presets.standalone',
        ],
        plugins: ['SwaggerUIBundle.plugins.DownloadUrl'],
        ...config,
    }).replace(/"(SwaggerUIBundle\.[^"]+)"/g, '$1');
    const script = `window.onload = () => { window.ui = SwaggerUIBundle(${swaggerConfig}); };`;

    return renderDocsHtmlShell(title, head, scriptUrl, cssUrl, script);
};

function serializeConfig(value: unknown): string {
    return JSON.stringify(value)
        .replace(/&/g, '\\u0026')
        .replace(/'/g, '\\u0027')
        .replace(/</g, '\\u003C')
        .replace(/>/g, '\\u003E');
}

function renderDocsHtmlShell(
    title: string,
    head: string,
    scriptUrl: string,
    cssUrl: string | undefined,
    initialize: string
): string {
    const escapeHtml = (value: string) =>
        value.replace(
            /[&"<>]/g,
            (character) =>
                ({
                    '&': '&amp;',
                    '"': '&quot;',
                    '<': '&lt;',
                    '>': '&gt;',
                })[character]!
        );

    return `<!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>${escapeHtml(title)}</title>
            ${cssUrl ? `<link rel="stylesheet" href="${escapeHtml(cssUrl)}" />` : ''}
            ${head}
          </head>
          <body>
            <div id="app"></div>
            <script src="${escapeHtml(scriptUrl)}"></script>
            <script>${initialize}</script>
          </body>
        </html>`;
}

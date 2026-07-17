import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    // Use './' prefix so hey-api treats this as a local file path,
    // not as an 'organization/project' shorthand (which breaks for paths with slashes).
    input: './docs/api/api-development.yaml',
    output: 'server/orpc/generated',
    plugins: [
        {
            name: 'orpc',
            validator: {
                input: 'zod',
                output: 'zod',
            },
        },
    ],
});

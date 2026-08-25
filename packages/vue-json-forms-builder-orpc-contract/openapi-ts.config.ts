import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: './docs/api-development.yaml',
    output: 'src/generated',
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

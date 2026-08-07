# Development

Some general notes about development

# Docker

Since we use turbo as a monorepo tool, the docker build context must be the root of the monorepo so docker knows what has changed and can utilize caches correctly.

```bash
# Build the docker image from the monorepo root:
docker build -f apps/json-forms-builder/Dockerfile -t json-forms-builder:local .

# start the backend from the form builder folder
docker compose --profile ci up -d --build
```
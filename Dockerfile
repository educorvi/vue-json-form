# syntax=docker/dockerfile:1

# ----------------------------------------------------------------------------
# Base image shared by all stages
# ----------------------------------------------------------------------------
FROM node:22-alpine AS base
# glibc compatibility shim for native deps (esbuild, rollup, ...)
RUN apk add --no-cache libc6-compat jq
WORKDIR /app
RUN corepack enable

# ----------------------------------------------------------------------------
# Prepare the monorepo
# ----------------------------------------------------------------------------
FROM base AS prepare
COPY package.json yarn.lock ./
RUN TURBO_VERSION=$(yarn info turbo -A --json | jq ".children.Version") \
    npm install --global "turbo@$TURBO_VERSION"
COPY . .

# ----------------------------------------------------------------------------
# Form Builder: Prune the monorepo to just what vue-json-forms-builder needs
# ----------------------------------------------------------------------------

FROM prepare AS prepare-form-builder

RUN turbo prune vue-json-forms-builder --docker
# see: https://turborepo.dev/docs/guides/tools/docker

# ----------------------------------------------------------------------------
# Form Builder Build image
# ----------------------------------------------------------------------------
FROM base AS build-form-builder

COPY --from=prepare-form-builder /app/out/json/ ./

RUN --mount=type=cache,target=/root/.yarn \
    yarn install --immutable

COPY --from=prepare-form-builder /app/out/full/ ./

RUN --mount=type=cache,target=/app/.turbo \
    yarn turbo run build:internal --filter=vue-json-forms-builder

# ----------------------------------------------------------------------------
# Form Builder Runtime image
# ----------------------------------------------------------------------------
FROM base AS run-form-builder
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/v1/status || exit 1
EXPOSE 3000
COPY --from=build-form-builder /app/apps/vue-json-forms-builder/.output ./
CMD ["node", "server/index.mjs"]


# ----------------------------------------------------------------------------
# Collab Server: Prune the monorepo to just what vue-json-forms-builder-collab-server needs
# ----------------------------------------------------------------------------

# Collab Server
FROM prepare AS prepare-collab-server

RUN turbo prune vue-json-forms-builder-collab-server --docker
# see: https://turborepo.dev/docs/guides/tools/docker

# ----------------------------------------------------------------------------
# Collab Server Build image
# ----------------------------------------------------------------------------
FROM base AS build-collab-server

COPY --from=prepare-collab-server /app/out/json/ ./

RUN --mount=type=cache,target=/root/.yarn \
    yarn install --immutable

COPY --from=prepare-collab-server /app/out/full/ ./

RUN --mount=type=cache,target=/app/.turbo \
    yarn turbo run build:internal --filter=vue-json-forms-builder-collab-server

# ----------------------------------------------------------------------------
# Collab Server Runtime image
# ----------------------------------------------------------------------------
FROM base AS run-collab-server
ENV NODE_ENV=production
ENV COLLAB_PORT=1234
ENV HOST=0.0.0.0
COPY --from=prepare-collab-server /app/out/json/ ./
RUN --mount=type=cache,target=/root/.yarn \
    yarn workspaces focus vue-json-forms-builder-collab-server --production
COPY --from=build-collab-server /app/apps/vue-json-forms-builder-collab-server/dist ./apps/vue-json-forms-builder-collab-server/dist
COPY --from=build-collab-server /app/packages/vue-json-forms-builder-schemas/dist ./packages/vue-json-forms-builder-schemas/dist
COPY --from=build-collab-server /app/packages/vue-json-forms-builder-db-layer/dist ./packages/vue-json-forms-builder-db-layer/dist
COPY --from=build-collab-server /app/packages/vue-json-forms-builder-orpc-contract/dist ./packages/vue-json-forms-builder-orpc-contract/dist
# The builder-schemas bundle keeps JSON schema imports external. The schemas
# package publishes src/ui as runtime assets, so reproduce that package layout
# for the workspace symlink created by `yarn workspaces focus`.
COPY --from=build-collab-server /app/packages/schemas/src/ui ./packages/schemas/src/ui
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "const s=require('net').connect(1234,'127.0.0.1');s.on('connect',()=>process.exit(0));s.on('error',()=>process.exit(1));setTimeout(()=>process.exit(1),5000)"
EXPOSE 1234
CMD ["node", "apps/vue-json-forms-builder-collab-server/dist/index.mjs"]


# ----------------------------------------------------------------------------
# External Example App (demo): Prune the monorepo to what the demo needs
# ----------------------------------------------------------------------------

FROM prepare AS prepare-external-demo

RUN turbo prune vue-json-forms-builder-external-example --docker

# ----------------------------------------------------------------------------
# External Example App: Build image
# ----------------------------------------------------------------------------
FROM base AS build-external-demo

COPY --from=prepare-external-demo /app/out/json/ ./

RUN --mount=type=cache,target=/root/.yarn \
    yarn install --immutable

COPY --from=prepare-external-demo /app/out/full/ ./

RUN --mount=type=cache,target=/app/.turbo \
    yarn turbo run build:internal --filter=@educorvi/vue-json-forms-builder-webcomponent && \
    cd apps/vue-json-forms-builder-external-example && yarn sync:webcomponent && \
    yarn turbo run build:internal --filter=vue-json-forms-builder-external-example

# ----------------------------------------------------------------------------
# External Example App: Runtime image
# ----------------------------------------------------------------------------
FROM base AS run-external-demo
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/ || exit 1
EXPOSE 3000
COPY --from=build-external-demo /app/apps/vue-json-forms-builder-external-example/.output ./
CMD ["node", "server/index.mjs"]

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
# Form Builder: Prune the monorepo to just what json-forms-builder needs
# ----------------------------------------------------------------------------

FROM prepare AS prepare-form-builder

RUN turbo prune json-forms-builder --docker
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
    yarn turbo run build:internal --filter=json-forms-builder

# ----------------------------------------------------------------------------
# Form Builder Runtime image
# ----------------------------------------------------------------------------
FROM base AS run-form-builder
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/v1/status || exit 1
EXPOSE 3000
COPY --from=build-form-builder /app/apps/json-forms-builder/.output ./
CMD ["node", "server/index.mjs"]


# ----------------------------------------------------------------------------
# Collab Server: Prune the monorepo to just what collab-server needs
# ----------------------------------------------------------------------------

# Collab Server
FROM prepare AS prepare-collab-server

RUN turbo prune collab-server --docker
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
    yarn turbo run build:internal --filter=collab-server

# ----------------------------------------------------------------------------
# Collab Server Runtime image
# ----------------------------------------------------------------------------
FROM base AS run-collab-server
ENV NODE_ENV=production
ENV COLLAB_PORT=1234
ENV HOST=0.0.0.0
EXPOSE 1234
COPY --from=build-collab-server /app/apps/collab-server/dist ./
CMD ["node", "src/index.js"]

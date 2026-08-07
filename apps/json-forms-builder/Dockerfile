# syntax=docker/dockerfile:1
#
# Build this image from the MONOREPO ROOT (the Dockerfile lives here, but
# `turbo prune` must run against the whole repo):
#
#   docker build -f apps/json-forms-builder/Dockerfile -t json-forms-builder:latest .
#
# `docker compose --profile ci up -d --build` also works: docker-compose.yaml
# already points the `app` service at this Dockerfile with the repo root as
# build context.

# ----------------------------------------------------------------------------
# Base image shared by all stages
# ----------------------------------------------------------------------------
FROM node:22-alpine AS base
# glibc compatibility shim for native deps (esbuild, rollup, ...)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ----------------------------------------------------------------------------
# Stage 1 - prune the monorepo to just what json-forms-builder needs
# ----------------------------------------------------------------------------
FROM base AS prepare
# `yarn` shim; the exact version is taken from `packageManager` in package.json
RUN corepack enable
# Copy ONLY the root manifests first - the turbo version is read from the root
# package.json, so there is a single source of truth (no version pinned here
# that can drift from the repo's devDependency). This layer only re-runs when
# package.json or yarn.lock change, so code changes never re-trigger the ~20s
# global install.
COPY package.json yarn.lock ./
RUN TURBO_VERSION=$(node -p "require('./package.json').devDependencies.turbo.replace(/^[~^]/, '')") \
    && npm install --global "turbo@$TURBO_VERSION"
# Send the whole monorepo. The root .dockerignore keeps node_modules, .env,
# docs, tests etc. out of the build context - every file that is included AND
# changes invalidates this COPY and everything after it.
COPY . .
RUN turbo prune json-forms-builder --docker
# out/json:  root package.json, PRUNED yarn.lock, .yarnrc.yml, the Yarn
#            release binary and every needed workspace's package.json
# out/full:  the same plus the actual sources of those workspaces

# ----------------------------------------------------------------------------
# Stage 2 - install dependencies, then build with turbo
# ----------------------------------------------------------------------------
FROM base AS builder
# (a) Install manifest only, so this layer is cached until the lockfile or a
#     package.json changes - no matter how often the sources change.
COPY --from=prepare /app/out/json/ ./
# Yarn 4: `--immutable` is the equivalent of the old `--frozen-lockfile`.
# The pruned lockfile already matches the pruned manifests, so it must not
# be modified. If the `nuxt prepare` postinstall fails here (no sources
# present yet), fall back to `yarn install --immutable --ignore-scripts` -
# `nuxt build` re-runs prepare anyway.
# Yarn's global cache (~/.yarn) is cache-mounted so installs only re-download
# what actually changed (BuildKit persists this between builds).
RUN --mount=type=cache,target=/root/.yarn \
    corepack enable \
    && yarn install --immutable
# (b) Now the actual sources.
COPY --from=prepare /app/out/full/ ./
# Optional remote caching:
#   docker build ... --build-arg TURBO_TEAM=... --build-arg TURBO_TOKEN=...
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM
ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN
# Build only the app; turbo runs `build:internal` of its workspace
# dependencies automatically (see `dependsOn: ["^build:internal"]`).
# turbo's cache (default: <root>/.turbo/cache) is cache-mounted so it survives
# between Docker builds: only the changed package is rebuilt, like locally.
# (Remote caching via TURBO_TEAM/TURBO_TOKEN above is the CI-grade variant.)
RUN --mount=type=cache,target=/app/.turbo \
    yarn turbo run build:internal --filter=json-forms-builder

# ----------------------------------------------------------------------------
# Stage 3 - runtime. Nitro's `.output` is self-contained (server code, deps
# and public/ assets), so the image only needs that folder.
# ----------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
# Must match docker-compose.yaml (`3100:3000`) and its healthcheck on :3000
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000
COPY --from=builder /app/apps/json-forms-builder/.output ./
CMD ["node", "server/index.mjs"]

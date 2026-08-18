# syntax=docker/dockerfile:1
#
# Standalone Hocuspocus realtime-collaboration backend (collab-server/).
#
# The collab server is NOT part of the Nuxt app build: it is a separate
# process (locally: `yarn dev:collab`, in this image: `tsx
# collab-server/index.ts`) that shares the TypeORM entities and the Postgres
# database with the Nuxt backend.
#
# Build this image from the MONOREPO ROOT (like the app's Dockerfile, because
# `turbo prune` must run against the whole repo):
#
#   docker build -f apps/json-forms-builder/collab-server/Dockerfile \
#     -t json-forms-builder-collab:latest .
#
# `docker compose --profile ci up -d --build` also works: docker-compose.yaml
# already points the `collab` service at this Dockerfile with the repo root
# as build context.

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
# Stage 2 - install dependencies, then build the workspace packages the
# collab server imports (`@educorvi/vue-json-form-builder-schemas` and its
# deps - the Nuxt app itself is built by the `app` Dockerfile).
# ----------------------------------------------------------------------------
FROM base AS builder
# (a) Install manifest only, so this layer is cached until the lockfile or a
#     package.json changes - no matter how often the sources change.
COPY --from=prepare /app/out/json/ ./
# Yarn 4: `--immutable` is the equivalent of the old `--frozen-lockfile`.
# tsx (a devDependency) is installed here too - the collab server runs from
# source via tsx, exactly like `yarn dev:collab`.
# Yarn's global cache (~/.yarn) is cache-mounted so installs only re-download
# what actually changed (BuildKit persists this between builds).
RUN --mount=type=cache,target=/root/.yarn \
    corepack enable \
    && yarn install --immutable
# (b) Now the actual sources.
COPY --from=prepare /app/out/full/ ./
# Build the dist/ of the workspace packages the collab server imports (the
# `./collab` export of vue-json-form-builder-schemas; turbo also builds its
# workspace dependencies, e.g. vue-json-form-schemas, via `^build:internal`).
# turbo's cache (default: <root>/.turbo/cache) is cache-mounted so it survives
# between Docker builds.
RUN --mount=type=cache,target=/app/.turbo \
    yarn turbo run build:internal --filter=@educorvi/vue-json-form-builder-schemas

# ----------------------------------------------------------------------------
# Stage 3 - runtime. Unlike the Nuxt app (.output is self-contained), this
# process needs its node_modules (tsx + the workspace packages, symlinked
# into node_modules by Yarn's node-modules linker) and the sources, so the
# whole pruned workspace and node_modules are copied from the builder.
# ----------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
# Hocuspocus listens on COLLAB_PORT (see collab-server/index.ts); keep in
# sync with the `collab` service port mapping in docker-compose.yaml.
ENV COLLAB_PORT=1234
# tsx lives in node_modules/.bin - no yarn/corepack needed at runtime.
ENV PATH=/app/node_modules/.bin:$PATH
EXPOSE 1234
# `COPY --from=prepare /app/out/full/ ./` above already flattened the pruned
# workspace into /app (apps/, packages/, ...), so copying /app from the
# builder pulls sources + node_modules (+ built dist/) in one go.
COPY --from=builder /app/ ./
# --tsconfig mirrors the dev script (`dev:collab`): the entities live outside
# collab-server/ and need the decorator/emitDecoratorMetadata settings.
CMD ["tsx", "--tsconfig", "apps/json-forms-builder/collab-server/tsconfig.json", "apps/json-forms-builder/collab-server/index.ts"]

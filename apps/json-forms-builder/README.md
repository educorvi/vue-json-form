# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.



# Nitro:
- doesn't support proper validation fo query parameters, return types with status code etc.

# tRPC

- supports proper validation but OpenAPI Export ist great


# oRPC:

- very similar to tRPC but with good OpenAPI support built in

## TODOS oRPC:
- Optimize SSR
- https://orpc.dev/docs/adapters/nuxt#optimize-ssr
- https://orpc.dev/docs/best-practices/optimize-ssr
- Add Authentication to routes



## TODO API:

- instead o parent path, return array of path and name so in a breadcrumb for a form / group, we can display the name instead of the path segment
- when searching all forms or all group, we should also provide the
- tree Children endpoint which is the same as the children endpoint but returns the elements in a tree view and searches all nesting level instead of the get children endpoint which only searches the direct children. this could also simply be the get groups endpoint which return the tree view.
- 


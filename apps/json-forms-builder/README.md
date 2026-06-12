# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
yarn install
```

Start the development server on `http://localhost:3000`:

```bash
yarn dev
```

Build the application for production:

```bash
yarn build
```

Locally preview production build:

```bash
yarn preview
```

In order to debug the the frontend as well as the backend, a VsCode Debug configuration exists called `fullstack: nuxt` which starts the backend in debug mode and also launches a firefox browser instance with the frontend in debug mode. Breakpoints can be set both in the frontend and the backend code and will be hit when the corresponding code is executed. Simply access `http://localhost:3000` in the launched browser instance and click on `Sign In with Keycloak` and enter username: `test@educorvi.de`, password: `test` to log in. The database is seeded with some example folders and forms.

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.


## Framework Comparison

### Nitro:
- doesn't support proper validation for query parameters, return types with status code etc.

### tRPC

- supports proper validation but OpenAPI Export is not well supported

### oRPC:

- very similar to tRPC but with good OpenAPI support built in
- this approach is used and works very well, strong typing is nice in the development process and the generated openapi spec also looks good enough
- current problems: example values don't really work

## TODOS:
- Add Authentication to routes
- Only display action the user can do and grey out or remove other buttons.
  - Only admin users or global editors can create root groups
  - To create elements within other groups, the user either has to have the global role or the editor role for the parent group. If not don't display or grey out actions like add group or also edit group. The API could show the role for a user for each element additional to the array of roles for all users for an element.
- Form Builder is currently hacked in with tricky import path fixes and pinia doesn't work properly, this has to be fixed
- Somehow the keycloka login loads very long as well as clicking on the Form Builder Button. This has to be investigated.
- Permission Management: Currently no elements can be added, or edited as a normal user since no permissions can be set in the UI.
- Tree Repo for finding elements by path has to be updated so we don't use a for loop like currently so for a folder nested 5 levels deep, we don't need to do 5 sql queries but do it in a single one. See Tree repo in TypeORM.



## TODO API:

- instead o parent path, return array of path and name so in a breadcrumb for a form / group, we can display the name instead of the path segment
- when searching all forms or all group, we should also provide the
- tree Children endpoint which is the same as the children endpoint but returns the elements in a tree view and searches all nesting level instead of the get children endpoint which only searches the direct children. this could also simply be the get groups endpoint which return the tree view.
- 


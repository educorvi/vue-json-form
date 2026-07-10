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

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

The backend service also needs a functioning postgres database as well as a keycloak instance for oidc running. A `docker-compose.yaml` is provided to start start and preconfigure a postgres database and a keycloak instance. The backend service is configured to connect to the database and keycloak instance started by the docker-compose file. The keycloak credentials are username: `admin`, password: `admin` to log into the keycloak admin console. For the backend a test user is created in the realm used by the vue form builder with the username `test` and password `test`. The database is seeded with some example folders and forms when the backend is started in the development mode for the first time. In order to restore the database to the initial state, simply delete the bind volume fo the postgres database. To reset the keycloak instance, simply delete the bind volume for the keycloak instance and on the next start, the instance gets preconfigured using a exported realm configuration file.

In order to debug the the frontend as well as the backend, a VsCode Debug configuration exists called `fullstack: nuxt` which starts the backend in debug mode and also launches a firefox browser instance with the frontend in debug mode. Breakpoints can be set both in the frontend and the backend code and will be hit when the corresponding code is executed. Simply access `http://localhost:3000` in the launched browser instance and click on `Sign In with Keycloak` and enter username: `test`, password: `test` to log in. The database is seeded with some example folders and forms.

# TODO

- group delete, move and export, visibility and permissions
- Edit and delete for current project should be in ... mneu after create group / form
- Endpoints to get form content, create version, get version
- permission problem and also permission groups independent of normal folders / groups
- visibility rules: visible public, internal, private (only members)
- table components where we cna put in anything with slots and on mobile it is automatically converted into cards or custom components for each page for finder control how cards look

- TreeSelect styling (grey select tis off, indentation of children)
- select current folder maybe just the icon with tooltip and directly as an icon right to the selector, then slug of the current new folder behind the element, slug shorter description text
- spacing before group pagination, sub group pagination works
-

- Breadcrumb menu
- Development readme copy from other branch
- Cards for small screens so data gets rendered nicely instead of table
- navbar mobile friendly
- folder recursive browsing
- create /edit folder
- manage permissions for folder
- manage permission for form
- manage users
- form integration so when clicked, form gets loaded in frontend renderer
- api to get current form contents and revisions
- TODO: support webhooks so we can for example send a request to Gitlab when form gets updated, generic way with vars (form url, version, content_json, user who created the form etc.)
- landing page (explore ecosystem, Flutter and Vue Json Form, Generic UI rendering interfaces possible, integration of frontend component or standalone frontend)
- Start Page: last worked on, currently edited forms, last published versions of forms, etc.
- published forms sorted by date, so newest published /changed forms are easily found
-

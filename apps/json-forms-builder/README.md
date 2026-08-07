# Form Builder App

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

The backend service needs a functioning postgres database as well as a keycloak instance running for oidc. A `docker-compose.yaml` is provided to start and preconfigure a postgres database and a keycloak instance. The backend service is configured to connect to the database and keycloak instance started by the docker-compose file. The keycloak credentials are username: `admin`, password: `admin` to log into the keycloak admin console. For the backend a test user is created in the realm used by the vue form builder with the username `test` and password `test`. The database is seeded with some example folders and forms when the backend is started in the development mode for the first time. In order to restore the database to the initial state, simply delete the bind volume for the postgres database. To reset the keycloak instance, simply delete the bind volume for the keycloak instance and on the next start, the instance gets preconfigured using a exported realm configuration file.

In order to debug the the frontend as well as the backend, a VsCode Debug configuration exists called `fullstack: nuxt` which starts the backend in debug mode and also launches a firefox browser instance with the frontend in debug mode. Breakpoints can be set both in the frontend and the backend code and will be hit when the corresponding code is executed. Simply access `http://localhost:3000` in the launched browser instance and click on `Sign In with Keycloak` and enter username: `test`, password: `test` to log in. The database is seeded with some example folders and forms.

## Further documentation

More documentation is available in the `docs/` folder:

- [API](./docs/api/README.md): Includes the openapi spec and general documentation of the API.
- [Database](./docs/database/README.md): Includes the database schema in different formats and more details about the database internal structure.
- [Testing](./docs/testing/README.md): More information on the available automated tests and how to run them.

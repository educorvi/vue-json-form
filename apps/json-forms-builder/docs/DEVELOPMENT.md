# Development

This document contains some notes and helpful information for development on the project.

## Docker

Since we use turbo as a monorepo tool, the docker build context must be the root of the monorepo so docker knows what has changed and can utilize caches correctly.

```bash
# Build the docker image from the monorepo root:
docker build -f apps/json-forms-builder/Dockerfile -t json-forms-builder:local .

# start the backend from the form builder folder
docker compose --profile ci up -d --build
```


## Keycloak Realm export

The development keycloak instances are automatically provisioned with a realm export and which configure the required users, clients etc. The keycloak database is not mounted on purpose so every change made in the UI is lost when the keylcoak container is recreated. The idwa here is that local setups cant get misconfigured and are completely defined within the realm exports tracked in git. When changes need to be made to keycloak, a [export-realm.sh](apps/json-forms-builder/keycloak/export-realm.sh) script exists which can be called to export the keycloak instances to the relam import json file in order to track the locally made changes in git.

## Backend Development Data

A very similar concept to the keycloak realm export exists for the backend development data. The database and its volume is persisted, but on first startup, the database is seeded with test data. The seed data is defined within [test-data.ts](apps/json-forms-builder/server/db/seed/test-data.ts) and also part of git version control so all developers get the same initial data for local development.

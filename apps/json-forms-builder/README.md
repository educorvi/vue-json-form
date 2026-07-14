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

The backend service also needs a functioning postgres database as well as a keycloak instance for oidc running. A `docker-compose.yaml` is provided to start start and preconfigure a postgres database and a keycloak instance. The backend service is configured to connect to the database and keycloak instance started by the docker-compose file. The keycloak credentials are username: `admin`, password: `admin` to log into the keycloak admin console. For the backend a test user is created in the realm used by the vue form builder with the username `test` and password `test`. The database is seeded with some example folders and forms when the backend is started in the development mode for the first time. In order to restore the database to the initial state, simply delete the bind volume fo the postgres database. To reset the keycloak instance, simply delete the bind volume for the keycloak instance and on the next start, the instance gets preconfigured using a exported realm configuration file.

In order to debug the the frontend as well as the backend, a VsCode Debug configuration exists called `fullstack: nuxt` which starts the backend in debug mode and also launches a firefox browser instance with the frontend in debug mode. Breakpoints can be set both in the frontend and the backend code and will be hit when the corresponding code is executed. Simply access `http://localhost:3000` in the launched browser instance and click on `Sign In with Keycloak` and enter username: `test`, password: `test` to log in. The database is seeded with some example folders and forms.

# TODO

- [x] Breadcrumb one clean element
- no grey background, grey header for individual elements, tree view chevron not visible, use tag for types of elements like wizard, control, object etc. When moving verticla layout, i immediatley get read border highlight thing with control, object, array only and this read thing in blue should be shown when moving elements or the border thin when selecitng / hovering over elements. Selection of wizard button next to root layout (vertical / horizontzl / group) is only light blue, not the normal blue. Preview elements when dropping form the left to the right side not fully extend to all the width, this should be the case like when the elements are dropped, the epxand to the full width on vertcial layout, should be the same for the preview. resize of left menu and right menu not working. 
- [x] Extra Component for the current span things for small elements like timestamp etc, so I define icon, text, and a sort of tooltip desciption which iss et as tolltip as well as aria label

- [ ] Dashboard
  - [x] Hi / Welcome Bakc, USername section with profile card
  - [x] section with recently added forms (Card, limit to only 5 and then a link which redirects to the view of all forms)
  - [x] Developer section with open api and swagger ui link, api version and status and ping
  - [x] Quick start create new form / create new folder
  - [ ] section with forms currently being edited
  - [ ] Newest version releases of forms
  - [ ] Your recent activity
  - [ ] currently edited forms
  - [ ] last published versions of forms, etc.
- [ ] Does it make sense to include permissions within post /put /patch form or should be simpl sue the individual permission endpoints? Same for schemas. Maybe for post it makes sense since for initial creation, we already have the data, but changes should be made individually
- [ ] Hooks for forms and folders, so for example, after a user finished editing (determined by our backend logic like he closes the form or after time x when the user hasn't made changes or is not using the editor anymore), the user can trigger a hook and do an api call, so he can simply define method, url with query parameters, body and use variables to send information to another server. Could also be configured to only send hooks after version release, needed for uvc.x Sync to gitlab repository
- [ ] group delete, move and export, visibility and permissions
- [x] Edit and delete for current project should be in ... menu after create group / form
- [ ] Endpoints to get form content, create version, get version
- [ ] permission problem and also permission groups independent of normal folders / groups
- [ ] visibility rules: visible public, internal, private (only members)
- [ ] table components where we can put in anything with slots and on mobile it is automatically converted into cards or custom components for each page for finder control how cards look

- [ ] TreeSelect styling (grey select tis off, indentation of children)
- [x] select current folder maybe just the icon with tooltip and directly as an icon right to the selector, then slug of the current new folder behind the element, slug shorter description text
- [x] spacing before group pagination, sub group pagination works
-

- [x] Breadcrumb menu
- [x] Development readme copy from other branch
- Cards for small screens so data gets rendered nicely instead of table
- [x] navbar mobile friendly
- [x] folder recursive browsing
- [x] create /edit folder
- [ ] manage permissions for folder
- [ ] manage permission for form
- [ ] manage users
- [x] form integration so when clicked, form gets loaded in frontend renderer
- [x] api to get current form contents and revisions
- [ ] support webhooks so we can for example send a request to Gitlab when form gets updated, generic way with vars (form url, version, content_json, user who created the form etc.)
- [x] landing page (explore ecosystem, Flutter and Vue Json Form, Generic UI rendering interfaces possible, integration of frontend component or standalone frontend)
-

# Testing


## E2E Tests

UI tests are performed to test the application as a whole like a user in he browser would.

- Preparation for tests scenarios could also be done on database level.
- Whole Ui, test data ids to get locators?

### Test Cases:

#### Generic
- User can login with valid credentials and sees dashboard
- User cannot login with invalid credentials and sees error page if keycloak redirects to login page with error
- Scalar and Swagger docs are available without errors

#### Landing:
- User can see landing page
- User can log in from landing page
- User can switch language on landing page
- User can switch between light and dark mode on landing page
- User can see details of landing page (features, Integrations, )

#### Dashboard
- Logged in user is redirected to dashboard and doesn't see landing page
- User is redirected to dashboard instead of landing page when accessing root after login
- User sees recent 6 forms on dashboard
- User can navigate to all forms
- User can click on an individual form to see the details
- User can click on Path of a form and navigate to the group
- User can click on quick action to create new form
- User can click on new group and create a new group

#### User profile page
- User profile page can be opened
- User can change language
- User can switch between light and dark mode
- User can log out and is redirected to landing page.

#### Forms
- User can list all forms
- User can sort and filter forms (generic helper for searching and sorting)
- Form details are displayed correctly in the list (Users, Date)
- User can click on Form to open it
- User can click on Form Path to go to folder
- User can open edit view of form
- User can delete form (click ..., click Delete, type name and delete form)
- User can delete form from form details page
- User can rename form in details
- User can add form and is navigated to the newly created form
- User can add form from groups details page

#### Users:
- List users and do sort and filtering

#### API Keys:
- List api key with filtering and sorting works
- Creating a new API key in the UI works and is displayed. Maybe also check if API key works with sample API call
- Edit and api key
- Delete an api key
- Future: Check setting different roles for api keys work
- Future: Test ui to select different projects with individual roles work with api keys

#### Group
- User can list folders
- User can sort and filter folders
- User can click on folder to open it
- User can click on folder chevron to display children and children of children
- Group details are displayed
- Groups can be created globally
- Groups can be created rom another group
- Groups cna be edited in details view (name, description)
- Groups cna be deleted from details view
- Groups can be deleted from list view (click ..., click Delete, type name and delete group)
- Edit view cna be opened from list view and details view
- Future: Groups can be moved to another group (drag and drop)

#### Permissions
- Users are added as an owner when creating a new form
- A owner can add other users as owners or editors to a form
- Future: If a user already has editor access to a form, he cant be added as viewer to the same form when adding a new person.
- A user can edit a permission of a user (change role)
- If a user already is part of a group and has a permission on that form, he cna be edited to a lower permission in the permission edit
- Inherited roles from parent groups are shown correctly in the permission list and cannot be edited or deleted
- User only see forms / groups they have access to
#### Form Builder Frontend
- Detailed tests for from builder within the package
- General test: Simple edit and realtime edit so other user makes changes and user sees the change in the ui

#### Breadcrumb Navigation
- Breadcrumb is shown for forms, groups and user page
- When navigating within a deeply nested group structure, the breadcrumb is shown correctly and user can navigate back to parent groups
- User can navigate back to dashboard by clicking home icon (e.g on groups page)


## Integration Tests: API

- Given When then Syntax
- API Level
- Database is initialized to predefined state before each test
- Test Component like Pagination Search Page: Pagination Works, Search works, Search is delayed by a few milliseconds so when user types only one search is done when he is finished. Search happens automatically after a few milliseconds after user stops typing.



## Unit Tests

Specific / complex logic are tested in unit tests to ensure that the logic works as expected. These tests are run in isolation and do not require a running server or database. [Vitest](https://vitest.dev/) is used as the test runner.

Examples where tests make sense:
- Json Schema und UI Schema export and parsing logic which represents form data
- Permission and access control business logic


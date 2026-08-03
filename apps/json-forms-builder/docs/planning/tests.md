# Testing


## E2E Tests

UI tests are performed to test the application as a whole like a user in he browser would.

- Preparation for tests scenarios could also be done on database level.
- Whole Ui, test data ids to get locators?

### Test Cases:

#### Generic
- Landing Page is displayed
- User can log in from Landing Page and Sees Dashboard Page afterwards
- Logged in user is redirected to dashboard and doesn't see landing page
- Scala and Swagger docs are available without errors

#### Dashboard
- User sees recent 6 forms on dashboard
- User can navigate to all forms
- User can click on a individual form
- User can click on Path of a form and navigate to the group
- User can click on quick action to create new form
- User can click on new group and create a new group

#### User profile page
- User profile page can be opened
- User cna change language
- User can switch between light and dark mode

#### Forms
- User can list all forms
- User can sort and filter forms
- Form details are displayed correctly
- User can click on Form to open it
- User cna click on Form PAth to go to folder
- User can open edit view of form
- User can delete form (click ..., click Delete, type name and delete form)
- User can Delete form from form details page
- User can rename form in details
- User can add form
- User can

#### Users:
- List users and do sort and filtering

#### API Keys:
- List, Create, Edit and Delete API Keys
- Future: Add specific forms and groups etc.

#### Group
- User can list folders
- User can sort and filter folders
- User can click on folder to open it
- User can click on folder chevron to display children and children of children
- Group details are displayed
Group Edit / Delete /Details

#### Permissions
- Users can add Permissions, edit and delete them
- Inherited permissions are displayed correctly
- User only see forms they have access to (more detailed tests in integration tests)
- Users only see groups they have access to (more detailed tests in integration tests)

#### Form Builder Frontend
- Detailed tests for from builder within the package
- General test: Simple edit and realtime edit so other user makes changes and user sees the change in the ui



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


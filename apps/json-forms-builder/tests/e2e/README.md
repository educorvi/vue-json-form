# End to End (E2E) tests

> See [tests/README.md](../README.md) for more general information on the test setup

UI browser tests that hit a **real, already-running** Nuxt server over HTTP using [Playwright](https://playwright.dev/). Refer to the general testing docu on how to start the backend correctly for automated tests. The tests interact with the Frontend UI of the form builder in a real browser, including logging in via Keycloak, and assert on the resulting UI state.

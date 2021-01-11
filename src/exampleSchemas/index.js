import showCaseUI from "./showcase/ui.json"
import showCaseJSON from "./showcase/schema.json"

import fsUI from "./5_Sicherheitsregeln/ui.json"
import fsJSON from "./5_Sicherheitsregeln/schema.json"

import fswUI from "./5_Sicherheitsregeln_wizard/ui.json"
import fswJSON from "./5_Sicherheitsregeln_wizard/schema.json"

import noUI from "./noUI.json"

export default {
    Showcase: {
        ui: showCaseUI,
        schema: showCaseJSON
    },
    "5 Sicherheitsregeln": {
        ui: fsUI,
        schema: fsJSON
    },
    "5 Sicherheitsregeln (Wizard)": {
        ui: fswUI,
        schema: fswJSON
    },
    "No UI-Schema": {
        ui: null,
        schema: noUI
    }
}

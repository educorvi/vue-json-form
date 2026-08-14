# Data Sync Frontend and Backend

The interactive form builder frontend component including real time collaboration with other users within a form is implemented using [Yjs](https://yjs.dev/) and [y-websocket](https://github.com/yjs/y-websocket) (or [Hocuspocus](https://hocuspocus.dev/), the production-grade server).

## Architecture

```
┌────────────────────────────┐        ┌──────────────────────────┐
│ Browser A (Vue builder)    │        │ Browser B (Vue builder)  │
│  Y.Doc (form tree)         │        │  Y.Doc (form tree)       │
│  awareness (selection,     │        │  awareness               │
│   cursor, editing field)   │        │                          │
└──────────┬─────────────────┘        └──────────┬───────────────┘
           │  ws: /collab/forms/{id}             │
           └──────────────┬──────────────────────┘
                     ┌────▼─────────────────────┐
                     │ Realtime server          │
                     │ (Hocuspocus standalone,  │
                     │  Nitro plugin or docker) │
                     │  - document sync (Yjs)   │
                     │  - awareness broadcast   │
                     │  - auth via session      │
                     │  - onConnect/onDisconnect│
                     │    → form_session table  │
                     └────┬─────────────────────┘
                          │
              ┌───────────▼───────────┐    ┌───────────────────────────┐
              │ PostgreSQL (TypeORM) │    │ oRPC API (existing)       │
              │  form.schema jsonb   │◄───┤ PUT /rpc/forms/{id}/schema│
              │  form_revision       │    │ GET  /rpc/forms/{id}/     │
              │  form_session (new)  │    │      active-sessions (new)│
              └──────────────────────┘    └───────────────────────────┘
```

/**
 * Presence / awareness layer for realtime collaboration.
 *
 * Yjs itself only syncs the document (what the form IS). Everything about
 * "who is here and what are they doing" lives in the Awareness protocol:
 * online users, the currently selected element and the field being edited.
 *
 * Awareness is ephemeral fire-and-forget state — it is NOT part of the
 * document, is never persisted, and needs no conflict resolution.
 *
 * These helpers are deliberately provider-agnostic: they work with the
 * `awareness` instance of y-websocket's WebsocketProvider and of
 * Hocuspocus's client. No y-protocols import needed in this package.
 *
 * Cursors are intentionally NOT part of this module: remote cursor
 * positions make no sense without a shared coordinate space (users have
 * different screen sizes / scroll positions), so they are not synced.
 */

export interface CollabUser {
    /** user id — in the backend this is the Keycloak sub / DB user id */
    id: string;
    name: string;
    /** avatar/selection color, deterministic per user id (colorForUser) */
    color: string;
}

/** The element a user currently has selected (tree/canvas). */
export interface SelectionPresence {
    /** uid of the selected element, null when nothing is selected */
    elementId: string | null;
}

/** The settings field a user is currently editing. */
export interface EditingPresence {
    /** uid of the element whose settings are being edited */
    elementId: string | null;
    /** which property is currently focused, e.g. "title", "placeholder" */
    field: string | null;
}

/**
 * The full per-client presence state broadcast to all other clients.
 * `selection` and `editing` are always present (possibly empty) so
 * consumers never have to deal with undefined.
 */
export interface PresenceState {
    user: CollabUser;
    selection: SelectionPresence;
    editing: EditingPresence;
}

/** A remote presence bundled with the client id that produced it. */
export interface RemotePresence extends PresenceState {
    clientId: number;
}

/**
 * The color every user sees for THEMSELVES: the Bootstrap primary color.
 * It is reserved — `colorForUser` never returns it, so remote users are
 * always visually distinguishable from "me".
 */
export const OWN_USER_COLOR = '#0d6efd'; // bootstrap primary

/**
 * Colors assigned deterministically from the user id so every client
 * shows the same color for the same user. Deliberately excludes the
 * bootstrap primary color — that one is reserved for the local user
 * (see OWN_USER_COLOR).
 */
const USER_COLOR_PALETTE = [
    '#d63384', // pink
    '#198754', // green
    '#fd7e14', // orange
    '#6f42c1', // purple
    '#0dcaf0', // cyan
    '#dc3545', // red
    '#20c997', // teal
    '#ffc107', // yellow
    '#6610f2', // indigo
] as const;

/** Stable per-user color from a fixed palette (hash of the user id). */
export function colorForUser(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    }
    return USER_COLOR_PALETTE[hash % USER_COLOR_PALETTE.length];
}

/** Structural subset of the y-protocols Awareness API used here. */
export interface AwarenessLike {
    /** id of the local client (y-protocols exposes this on every awareness) */
    clientID: number;
    setLocalStateField(field: string, value: unknown): void;
    setLocalState(state: unknown): void;
    getStates(): Map<number, unknown>;
    on(event: 'change', callback: (changes: unknown) => void): void;
    off(event: 'change', callback: (changes: unknown) => void): void;
}

/** Announce the current user (call once after connecting). */
export function setPresenceUser(
    awareness: AwarenessLike,
    user: CollabUser
): void {
    awareness.setLocalStateField('user', user);
}

/** The element currently selected in the tree/canvas. */
export function setSelectedElement(
    awareness: AwarenessLike,
    elementId: string | null
): void {
    awareness.setLocalStateField('selection', { elementId });
}

/** The field the user is currently editing in the right panel. */
export function setEditingField(
    awareness: AwarenessLike,
    elementId: string | null,
    field: string | null
): void {
    awareness.setLocalStateField('editing', { elementId, field });
}

// ─── Reading presence (guarded, so malformed states never crash the UI) ─────

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isCollabUser(value: unknown): value is CollabUser {
    return (
        isRecord(value) &&
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.color === 'string'
    );
}

function parsePresenceState(state: unknown): PresenceState | null {
    if (!isRecord(state)) return null;
    const user = isCollabUser(state.user) ? state.user : null;
    if (!user) return null; // no user → not a presence state we care about
    const selection = isRecord(state.selection)
        ? {
              elementId:
                  typeof state.selection.elementId === 'string'
                      ? state.selection.elementId
                      : null,
          }
        : { elementId: null };
    const editing = isRecord(state.editing)
        ? {
              elementId:
                  typeof state.editing.elementId === 'string'
                      ? state.editing.elementId
                      : null,
              field:
                  typeof state.editing.field === 'string'
                      ? state.editing.field
                      : null,
          }
        : { elementId: null, field: null };
    return { user, selection, editing };
}

/**
 * All remote presence states (excluding the local client), validated and
 * normalized. Keyed by client id.
 */
export function getRemotePresenceStates(
    awareness: AwarenessLike
): Map<number, PresenceState> {
    const states = new Map<number, PresenceState>();
    for (const [clientId, state] of awareness.getStates()) {
        if (clientId === awareness.clientID) continue;
        const parsed = parsePresenceState(state);
        if (parsed) states.set(clientId, parsed);
    }
    return states;
}

/**
 * Remote presences as a stable array (clientId + state) — the shape the
 * builder UI consumes for presence highlighting.
 */
export function getRemotePresences(awareness: AwarenessLike): RemotePresence[] {
    const presences: RemotePresence[] = [];
    for (const [clientId, state] of awareness.getStates()) {
        if (clientId === awareness.clientID) continue;
        const parsed = parsePresenceState(state);
        if (parsed) presences.push({ clientId, ...parsed });
    }
    return presences;
}

/** All clients currently connected to this form's room (incl. local). */
export function getConnectedUsers(awareness: AwarenessLike): CollabUser[] {
    const users: CollabUser[] = [];
    for (const state of awareness.getStates().values()) {
        const parsed = parsePresenceState(state);
        if (parsed) users.push(parsed.user);
    }
    return users;
}

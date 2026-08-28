import type { Locator, Page } from '@playwright/test';

/**
 * Playwright locators for the `<VueJsonFormBuilder>` UI
 */
export function builderLocators(page: Page) {
    return {
        /** AppHeader.vue's root — hidden entirely when `hideHeader` is set. */
        header: (): Locator => page.locator('.app-header'),

        /** A canvas element by its builder uid (CanvasNode.vue). */
        canvasElement: (uid: string): Locator =>
            page.locator(`[data-element-id="${uid}"]`),

        /** All canvas elements of a given schema element type (e.g. 'string'). */
        canvasElementsByType: (type: string): Locator =>
            page.locator(`[data-element-type="${type}"]`),

        /** The root form's canvas element. */
        rootCanvasElement: (): Locator =>
            page.locator('[data-element-type="form"]'),

        /** The presence avatar stack shown in a canvas element's header
         *  (UserAvatarStack.vue) — only present while other users have that
         *  element selected. */
        elementPresenceStack: (uid: string): Locator =>
            page
                .locator(`[data-element-id="${uid}"]`)
                .locator('.user-avatar-stack'),

        /** A specific user's avatar within any presence stack, by display name. */
        presenceAvatarByName: (name: string): Locator =>
            page.locator('.user-avatar-stack').locator(`[title="${name}"]`),

        /** A left-panel palette item (PaletteItem.vue) — clicking it adds
         *  that field type to the root (FieldPalette.vue's `addField`), no
         *  drag-and-drop needed. `type` is a PaletteElementType, e.g. 'text'. */
        paletteField: (type: string): Locator =>
            page.locator(`[data-palette-type="${type}"]`),

        /** The toolbar's overall presence indicator (OnlineState.vue) —
         *  its `title` attribute lists every known user's name, comma
         *  separated. Useful to assert "both users are present" without
         *  matching individual avatars. */
        onlineState: (): Locator => page.locator('.online-state'),
    };
}

export type BuilderLocators = ReturnType<typeof builderLocators>;

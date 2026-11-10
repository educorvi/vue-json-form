import { computed, type Ref } from 'vue';
import type { Button, Layout, Wizard } from '@educorvi/vue-json-form-schemas';

/**
 * Returns a computed ref containing the HTML `type` attribute value for a
 * button element. Only the native HTML button types (`submit`, `reset`,
 * `button`) are returned; wizard-specific button types (e.g.
 * `nextWizardPage`) resolve to `undefined` so the attribute is omitted.
 *
 * @param layoutElement - The button layout element.
 * @returns A computed ref of `'submit' | 'reset' | 'button' | undefined`.
 */
export function getHtmlButtonType(layoutElement: Button) {
    return computed(() => {
        if (['submit', 'reset', 'button'].includes(layoutElement.buttonType)) {
            return layoutElement.buttonType as 'submit' | 'reset' | 'button';
        } else {
            return undefined;
        }
    });
}

/**
 * Returns a computed ref of the maximum page index for a wizard form.
 *
 * @param uiSchema - A readonly ref to the root UI schema (Wizard, Layout, or undefined).
 * @returns A computed ref of the 0-based maximum page index.
 */
export function getMaxPages(
    uiSchema: Readonly<Ref<Wizard | Layout | undefined>>
) {
    return computed(() => {
        if (uiSchema.value?.type !== 'Wizard') return Number.MAX_SAFE_INTEGER;

        return uiSchema.value.pages.length - 1;
    });
}

/**
 * Creates a click handler for wizard navigation buttons
 * (`previousWizardPage` / `nextWizardPage`).
 *
 * For *next* navigation the current page's validation function is called
 * first; the page advance is skipped when validation fails. On success,
 * `formStateWasValidated` is reset so that per-page validation feedback is
 * cleared before the new page is shown.
 *
 * @param layoutElement - The button layout element that triggered navigation.
 * @param currentWizardPage - Ref holding the active 0-based page index.
 * @param wizardValidateFunctions - Ref to an array of per-page validation
 *   functions. Each function returns `true` when the page is valid.
 * @param formStateWasValidated - Ref that tracks whether the form has been
 *   explicitly validated; reset to `false` on successful page advance.
 * @param maxPages - Readonly ref of the maximum page index (from
 *   {@link getMaxPages}).
 * @returns A parameterless handler function to be attached to the button's
 *   click event.
 */
export function getWizardHandler(
    layoutElement: Button,
    currentWizardPage: Ref<number>,
    wizardValidateFunctions: Ref<(() => boolean)[]>,
    formStateWasValidated: Ref<boolean>,
    maxPages: Readonly<Ref<number>>
) {
    return () => {
        if (layoutElement.buttonType === 'previousWizardPage') {
            currentWizardPage.value = Math.max(currentWizardPage.value - 1, 0);
        } else if (layoutElement.buttonType === 'nextWizardPage') {
            const valid =
                wizardValidateFunctions.value[currentWizardPage.value]?.() ||
                false;
            if (!valid) {
                return;
            } else {
                formStateWasValidated.value = false;
            }
            currentWizardPage.value = Math.min(
                currentWizardPage.value + 1,
                maxPages.value
            );
        }
    };
}

import { computed, type Ref } from 'vue';
import type { Button, Layout, Wizard } from '@educorvi/vue-json-form-schemas';

export function getHtmlButtonType(layoutElement: Button) {
    return computed(() => {
        if (['submit', 'reset', 'button'].includes(layoutElement.buttonType)) {
            return layoutElement.buttonType as 'submit' | 'reset' | 'button';
        } else {
            return undefined;
        }
    });
}

export function getMaxPages(
    uiSchema: Readonly<Ref<Wizard | Layout | undefined>>
) {
    return computed(() => {
        if (uiSchema.value?.type !== 'Wizard') return Number.MAX_SAFE_INTEGER;

        return uiSchema.value.pages.length - 1;
    });
}

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

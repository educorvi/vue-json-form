import type {
    HTMLRenderer,
    LayoutElement,
} from '@educorvi/vue-json-form-schemas';
import { getOption } from '@/renderings/renderHelpers';

export function getHtmlMessages(layoutElement: LayoutElement) {
    const messages: { pre?: HTMLRenderer; post?: HTMLRenderer } = {};
    const preHtml = getOption(layoutElement, 'preHtml');
    if (preHtml) {
        messages.pre = {
            type: 'HTML',
            htmlData: preHtml,
        };
    }

    const postHtml = getOption(layoutElement, 'postHtml');
    if (postHtml) {
        messages.post = {
            type: 'HTML',
            htmlData: postHtml,
        };
    }

    return messages;
}

/**
 * useClipboard — Copy text to the clipboard with a graceful fallback
 * (execCommand for non-secure contexts) and an optional success toast.
 */
export function useClipboard() {
    const { notify } = useNotify();

    /**
     * Copy `text` to the clipboard.
     * @returns true when the copy succeeded.
     */
    async function copyToClipboard(
        text: string,
        successMessage?: string,
        errorMessage?: string
    ): Promise<boolean> {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for non-secure contexts (e.g. plain http on LAN)
                const el = document.createElement('textarea');
                el.value = text;
                el.style.position = 'fixed';
                el.style.opacity = '0';
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            }
            if (successMessage) notify(successMessage, 'success');
            return true;
        } catch {
            if (errorMessage) notify(errorMessage, 'danger');
            return false;
        }
    }

    return { copyToClipboard };
}

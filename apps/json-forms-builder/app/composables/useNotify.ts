/**
 * Simple toast notification composable.
 *
 * Uses a shared reactive array rendered by ToastContainer.vue.
 * BToast handles its own display lifecycle (auto-dismiss via model-value).
 */

export interface Toast {
    id: number;
    text: string;
    variant: 'danger' | 'success' | 'warning' | 'info';
    title?: string;
}

/**
 * Push a toast notification. Returns the notification id.
 */
export function useNotify() {
    const toasts = useState<Toast[]>('notify-toasts', () => []);
    const nextId = useState('notify-next-id', () => 0);

    function notify(
        text: string,
        variant: Toast['variant'] = 'danger',
        title?: string
    ): number {
        nextId.value++;
        const id = nextId.value;
        toasts.value = [...toasts.value, { id, text, variant, title }];
        return id;
    }

    function dismiss(id: number) {
        toasts.value = toasts.value.filter((n) => n.id !== id);
    }

    return {
        toasts,
        notify,
        dismiss,
    };
}

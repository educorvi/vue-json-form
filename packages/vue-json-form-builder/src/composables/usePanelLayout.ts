import { ref, watch, type Ref } from 'vue';
import type { FormBuilder } from '../useFormBuilder';

function makeResizer(
    widthRef: Ref<number>,
    sign: 1 | -1,
    min: number,
    max: number
) {
    return (e: MouseEvent) => {
        e.preventDefault();
        document.body.classList.add('is-resizing');
        const startX = e.clientX;
        const startW = widthRef.value;
        const onMove = (ev: MouseEvent) => {
            const deltaVw = ((ev.clientX - startX) / window.innerWidth) * 100;
            widthRef.value = Math.max(
                min,
                Math.min(max, startW + sign * deltaVw)
            );
        };
        const onUp = () => {
            document.body.classList.remove('is-resizing');
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };
}

/** Resizable left/right panel state (widths, collapse, visibility). */
export function usePanelLayout(builder: FormBuilder) {
    const leftWidthVw = ref(18);
    const rightWidthVw = ref(22);
    const leftCollapsed = ref(false);
    const rightVisible = ref(false);

    watch(
        () => builder.selectedElementId.value,
        (id) => {
            rightVisible.value = id !== null;
        }
    );

    const startResizeLeft = makeResizer(leftWidthVw, 1, 12, 30);
    const startResizeRight = makeResizer(rightWidthVw, -1, 15, 35);

    return {
        leftWidthVw,
        rightWidthVw,
        leftCollapsed,
        rightVisible,
        startResizeLeft,
        startResizeRight,
    };
}

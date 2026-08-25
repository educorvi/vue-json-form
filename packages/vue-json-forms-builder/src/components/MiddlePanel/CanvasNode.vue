<script setup lang="ts">
/**
 * CanvasNode.vue — the legacy CanvasElement design rebuilt on the
 * FormDefinition model (uid-based, builder ops).
 *
 *   root      → header (no drag handle) + layout switcher + DropZone
 *   container → header (drag handle) + layout switcher + DropZone
 *   leaf      → header (drag handle) + disabled VueJsonForm preview
 *
 * The layout switcher writes the container's `layout` field (typed with the
 * Layout enum from the schema definitions), which the schema generator maps
 * to VerticalLayout / HorizontalLayout.
 */
import { computed, ref } from 'vue';
import { BButton, BBadge } from 'bootstrap-vue-next';
import {
    PhTrash,
    PhEyeSlash,
    PhAsterisk,
    PhList,
    PhTable,
} from '@phosphor-icons/vue';
import { VueJsonForm, bootstrapComponents } from '@educorvi/vue-json-form';
import {
    StringElement,
    ColorElement,
    TimeElement,
    NumberElement,
    BooleanElement,
    EnumElement,
    CheckboxGroupElement,
    FileuploadElement,
    ContainerElement,
    Form,
    Layout,
    SchemaGenerator,
} from '@educorvi/vue-json-forms-builder-schemas';
import { useFormBuilder } from '../../useFormBuilder';
import {
    useDragState,
    setDragSource,
    setDragOverAncestorIds,
    setDragging,
} from '../../useDragState';
import { uiFor } from '@/elements';
import { ARRAY_ALLOWED_TYPES } from '@/types/paletteFields';
import EmptyDropTarget from '@/components/shared/EmptyDropTarget.vue';
import DropZone from './cards/DropZone.vue';
import UserAvatarStack from '@/components/shared/presence/UserAvatarStack.vue';
import { useElementPresence } from '@/composables/useElementPresence';

const props = withDefaults(defineProps<{ uid: string; isRoot?: boolean }>(), {
    isRoot: false,
});

const builder = useFormBuilder();
const { dragging, dragOverAncestorIds, draggedElementId } = useDragState();

// Other users that currently have THIS element selected (exact match only —
// ancestors of a remote selection are intentionally not highlighted).
const { selectors: remoteSelectors } = useElementPresence(props.uid);

/** First remote selector's color drives the ring when remote-selected. */
const remoteSelectionColor = computed(
    () => remoteSelectors.value[0]?.color ?? null
);

const formDefinition = computed(() => builder.formDefinition.value);
// The root Form is NOT part of nodesIndex — resolve it explicitly.
const element = computed(() => {
    if (props.isRoot) return formDefinition.value?.root ?? null;
    return formDefinition.value?.getElementById(props.uid) ?? null;
});
const isSelected = computed(
    () => builder.selectedElementId.value === props.uid
);
const isContainer = computed(() => element.value instanceof ContainerElement);
const children = computed(() => {
    const el = element.value;
    if (props.isRoot) return formDefinition.value?.root.children ?? [];
    return el instanceof ContainerElement ? el.children : [];
});
/** Data elements that get a disabled VueJsonForm preview. */
const isLeaf = computed(
    () =>
        element.value instanceof StringElement ||
        element.value instanceof ColorElement ||
        element.value instanceof TimeElement ||
        element.value instanceof NumberElement ||
        element.value instanceof BooleanElement ||
        element.value instanceof EnumElement ||
        element.value instanceof CheckboxGroupElement ||
        element.value instanceof FileuploadElement
);

const hovered = ref(false);

/** The schema `type` literal of the element — part of the data, not UI metadata. */
const elementType = computed(() => {
    const el = element.value;
    return (el?.data as { type?: string }).type ?? 'form';
});

// Presentation (icon, label, data type, required/hidden badges) comes from
// the element's ElementUi in the builder package.
const elementUi = computed(() => (element.value ? uiFor(element.value) : null));
const dataType = computed(() =>
    elementUi.value && element.value
        ? elementUi.value.dataType(element.value)
        : undefined
);
const iconClass = computed(() =>
    elementUi.value && element.value
        ? elementUi.value.icon(element.value)
        : 'bi bi-question-circle'
);
const fieldLabel = computed(() =>
    elementUi.value && element.value
        ? elementUi.value.label(element.value)
        : 'Untitled'
);
const isFieldRequired = computed(() =>
    elementUi.value && element.value
        ? elementUi.value.isRequired(element.value)
        : false
);
const isHidden = computed(() =>
    elementUi.value && element.value
        ? elementUi.value.isHidden(element.value)
        : false
);
/** The element being moved — only it stays highlighted while dragging. */
const isDraggedElement = computed(
    () => dragging.value && draggedElementId.value === props.uid
);

/** The container the element would currently be dropped into — the
 *  innermost hovered zone (index 0 of the ancestor chain), not every
 *  ancestor container. */
const isDropTarget = computed(
    () => dragging.value && dragOverAncestorIds.value[0] === props.uid
);

const outlineStyle = computed(() => {
    // the moved element itself stays highlighted (solid) while dragging
    if (isDraggedElement.value) return '2px solid var(--bs-primary)';
    if (isSelected.value) return '2px solid var(--bs-primary)';
    // remote selection ring — one user's color, never stacks on local select
    if (remoteSelectionColor.value)
        return `2px solid ${remoteSelectionColor.value}`;
    // only the actual drop target gets the dashed lines
    if (isDropTarget.value) return '2px dashed var(--bs-primary)';
    if (dragging.value) return '2px solid transparent';
    if (hovered.value) return '2px dashed var(--bs-primary)';
    return '2px solid transparent';
});

// ── Layout switcher (Vertical / Horizontal — the Layout enum from the
//    schema definitions; object/array have no Group layout) ─────────────────

const layoutTypeOpts: { label: string; value: Layout; icon: typeof PhList }[] =
    [
        { label: 'Vertical', value: Layout.Vertical, icon: PhList },
        { label: 'Horizontal', value: Layout.Horizontal, icon: PhTable },
    ];

const currentLayout = computed<Layout>(() => {
    const el = element.value;
    if (el instanceof ContainerElement) return el.layout;
    if (el instanceof Form) return el.data.layout;
    return Layout.Vertical;
});
function setLayout(value: Layout) {
    builder.updateElementField(props.uid, 'layout', value);
}

// Drop zone config — same semantics as the legacy nodes:
//   root / object → anything; array → max 1 child
type AllowedTypes = string[] | '*';
const dropLayout = computed<'vertical' | 'horizontal' | 'flex-row'>(() =>
    currentLayout.value === Layout.Horizontal ? 'horizontal' : 'vertical'
);
const allowedTypes = computed<AllowedTypes>(() =>
    elementType.value === 'array' ? ARRAY_ALLOWED_TYPES : '*'
);
const maxChildren = computed(() =>
    elementType.value === 'array' ? 1 : undefined
);

// ── HTML5 drag of the element itself (only non-root, via drag-handle) ───────

function onDragStart(e: DragEvent) {
    if (!e.dataTransfer || props.isRoot) return;
    e.dataTransfer.setData('text/plain', props.uid);
    e.dataTransfer.effectAllowed = 'move';
    setDragSource(elementType.value);
    setDragging(true);
}

function onDragEnd() {
    setDragSource(null);
    setDragOverAncestorIds([]);
    setDragging(false);
}

// ── Actions ──────────────────────────────────────────────────────────────────

function remove() {
    builder.deleteElement(props.uid);
}

// ── Leaf preview (VueJsonForm, disabled) ────────────────────────────────────
// The element class itself produces a valid single-element JSON Schema +
// UI Schema (toWrappedJsonSchema / toWrappedUiSchema — hidden is stripped
// from the preview so it stays visible; the header shows the hidden icon).

const preview = computed<{
    json: Record<string, unknown>;
    ui: Record<string, unknown>;
} | null>(() => {
    const el = element.value;
    const fd = formDefinition.value;
    // the root form has no leaf preview
    if (!el || el instanceof Form || !fd) return null;
    const generator = new SchemaGenerator(fd);
    return {
        json: el.toWrappedJsonSchema(generator) as Record<string, unknown>,
        ui: el.toWrappedUiSchema(generator, ['properties']) as Record<
            string,
            unknown
        >,
    };
});

function select(e: Event) {
    e.stopPropagation();
    builder.selectElement(props.uid);
}
</script>

<template>
    <div
        class="canvas-element-wrapper mb-2"
        :class="{ selected: isSelected }"
        :data-element-type="elementType"
        :data-element-id="props.uid"
        :style="{
            outline: outlineStyle,
            outlineOffset: '2px',
            borderRadius: '6px',
            transition: 'outline-color 0.15s, outline-style 0.15s',
        }"
        @mouseenter="!dragging && (hovered = true)"
        @mouseleave="hovered = false"
        @click="select"
    >
        <div class="canvas-element-inner rounded overflow-hidden border">
            <!-- Header -->
            <div
                :class="[
                    'canvas-element-header d-flex align-items-center gap-2 px-2 py-1 bg-body-tertiary',
                    isRoot ? '' : 'drag-handle',
                    isSelected ? 'bg-primary-subtle border-primary' : '',
                ]"
                :draggable="!isRoot"
                @dragstart="onDragStart"
                @dragend="onDragEnd"
            >
                <i :class="iconClass" class="text-xs text-body flex-shrink-0" />
                <span
                    class="text-xs fw-medium text-body text-truncate flex-grow-1"
                    >{{ fieldLabel }}</span
                >

                <!-- Other users that have this element selected -->
                <UserAvatarStack
                    v-if="remoteSelectors.length > 0"
                    :users="remoteSelectors"
                    size="xs"
                    :max="4"
                />

                <!-- Data type badge (only elements that represent data) -->
                <BBadge
                    v-if="!isRoot && dataType"
                    class="text-body text-xs flex-shrink-0"
                    variant="light"
                    >{{ dataType }}</BBadge
                >

                <!-- Required indicator -->
                <PhAsterisk
                    v-if="isFieldRequired"
                    :size="12"
                    class="text-danger flex-shrink-0"
                    weight="bold"
                    title="Required field"
                />

                <!-- Hidden indicator -->
                <PhEyeSlash
                    v-if="isHidden"
                    :size="12"
                    class="text-body flex-shrink-0"
                    weight="bold"
                    title="Hidden element"
                />

                <!-- Actions when selected and not root -->
                <div
                    v-if="isSelected && !isRoot"
                    class="d-flex align-items-center gap-1 flex-shrink-0 ms-1"
                    @click.stop
                >
                    <div class="vr" />
                    <b-button
                        variant="link"
                        class="p-0 border-0 text-danger text-decoration-none"
                        style="width: 1.25rem; height: 1.25rem; line-height: 1"
                        title="Delete"
                        @click="remove"
                    >
                        <PhTrash :size="12" weight="bold" />
                    </b-button>
                </div>
            </div>

            <!-- Body -->
            <div v-if="isContainer || isRoot" class="border-top">
                <!-- Layout type switcher -->
                <div
                    class="d-flex align-items-center px-2 py-1 border-bottom flex-wrap gap-1"
                    @click.stop
                >
                    <div class="btn-group btn-group-sm" role="group">
                        <b-button
                            v-for="opt in layoutTypeOpts"
                            :key="opt.value"
                            size="sm"
                            :variant="
                                currentLayout === opt.value
                                    ? 'primary'
                                    : 'outline-secondary'
                            "
                            @click="setLayout(opt.value)"
                        >
                            <component
                                :is="opt.icon"
                                :size="12"
                                weight="bold"
                                class="me-1"
                            />{{ opt.label }}
                        </b-button>
                    </div>
                </div>

                <!-- Children drop zone -->
                <DropZone
                    :parent-uid="props.uid"
                    :children="children"
                    :layout="dropLayout"
                    :allowed-types="allowedTypes"
                    :max-children="maxChildren"
                    :is-root="isRoot"
                    :empty-label="
                        elementType === 'array'
                            ? 'Drop the item element here'
                            : 'Drop elements here'
                    "
                >
                    <template v-if="isRoot && children.length === 0" #empty>
                        <EmptyDropTarget
                            message="Drag fields here to build your form"
                        />
                    </template>
                </DropZone>
            </div>

            <!-- Leaf element preview -->
            <div v-else-if="isLeaf" class="border-top px-3 py-2 canvas-preview">
                <VueJsonForm
                    :key="props.uid"
                    disabled
                    :json-schema="preview!.json"
                    :ui-schema="preview!.ui"
                    :render-interface="bootstrapComponents"
                    :on-submit-form="async () => {}"
                />
            </div>
        </div>
    </div>
</template>

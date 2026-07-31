<!--
    BootstrapSelect — Simple select dropdown using Bootstrap 5.
    Minimal implementation for reliable SSR.

    Props:
      modelValue (v-model)
      options        — Array of { label, value } or primitives
      placeholder    — Shown when no value selected
      emptyText      — Text shown when no options match the filter (default: common.noResults)
      filter         — Show search input
      filterText     — v-model:filterText for async search
      showClear      — Show × to clear
      loading        — Show spinner
      disabled       — Disable interaction

    Slots:
      #value="{ value, placeholder }" — Custom selected value display
      #option="{ option, label }" — Custom option content
-->
<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        modelValue?: any;
        options?: any[];
        optionLabel?: string;
        optionValue?: string;
        placeholder?: string;
        emptyText?: string;
        filter?: boolean;
        filterPlaceholder?: string;
        filterText?: string;
        showClear?: boolean;
        disabled?: boolean;
        loading?: boolean;
    }>(),
    {}
);

const emit = defineEmits<{
    'update:modelValue': [value: any];
    'update:filterText': [value: string];
}>();

const { t } = useI18n();

// Dropdown state
const open = ref(false);
const el = ref<HTMLElement | null>(null);

function labelOf(opt: any): string {
    if (opt == null) return '';
    if (typeof opt !== 'object') return String(opt);
    if (props.optionLabel) return String(opt[props.optionLabel] ?? '');
    return String(opt.label ?? opt.name ?? '');
}

function valueOf(opt: any): any {
    if (opt == null || typeof opt !== 'object') return opt;
    if (props.optionValue) return opt[props.optionValue];
    return opt.value ?? opt;
}

function isSelected(opt: any): boolean {
    return (
        props.modelValue != null &&
        String(valueOf(opt)) === String(props.modelValue)
    );
}

function select(opt: any) {
    emit('update:modelValue', valueOf(opt));
    open.value = false;
}

function onClear(e: MouseEvent) {
    e.stopPropagation();
    emit('update:modelValue', null);
    open.value = false;
}

const displayText = computed(() => {
    if (props.modelValue == null) return '';
    const m = (props.options ?? []).find(
        (o) => String(valueOf(o)) === String(props.modelValue)
    );
    return m ? labelOf(m) : String(props.modelValue);
});

// Filter
const localQ = ref('');
const query = computed({
    get: () => props.filterText ?? localQ.value,
    set: (v: string) => {
        localQ.value = v;
        emit('update:filterText', v);
    },
});

const visibleOptions = computed(() => {
    if (!props.filter || !query.value) return props.options ?? [];
    const q = query.value.toLowerCase();
    return (props.options ?? []).filter((o) =>
        labelOf(o).toLowerCase().includes(q)
    );
});

// Close on outside click
function onMouseDown(e: MouseEvent) {
    if (!open.value) return;
    if (el.value && !el.value.contains(e.target as Node)) {
        open.value = false;
    }
}

onMounted(() => document.addEventListener('mousedown', onMouseDown));
onBeforeUnmount(() => document.removeEventListener('mousedown', onMouseDown));

watch(open, (v) => {
    // Only clear the local query without emitting to parent (filterText),
    // so the parent's options don't disappear when the dropdown opens.
    if (v) localQ.value = '';
});
</script>

<template>
    <div ref="el" class="position-relative">
        <!-- Trigger -->
        <div
            class="d-flex align-items-center gap-1 form-control"
            :class="{ 'opacity-50': disabled || loading }"
            :tabindex="disabled ? -1 : 0"
            role="combobox"
            :aria-expanded="open"
            @click="if (!disabled && !loading) open = !open;"
            @keydown.enter.prevent="open = !open"
            @keydown.escape.prevent="open = false"
            style="cursor: pointer"
        >
            <span
                class="flex-grow-1 text-truncate"
                :class="{ 'text-body-tertiary': !modelValue }"
            >
                <slot
                    name="value"
                    :value="modelValue"
                    :placeholder="placeholder"
                >
                    {{ modelValue != null ? displayText : placeholder }}
                </slot>
            </span>

            <button
                v-if="showClear && modelValue != null && !disabled"
                type="button"
                class="btn-close btn-sm flex-shrink-0"
                style="font-size: 0.5rem; opacity: 0.4"
                @click.stop="onClear"
                tabindex="-1"
                aria-label="Clear"
            ></button>

            <div
                v-if="loading"
                class="spinner-border spinner-border-sm flex-shrink-0"
                role="status"
            ></div>
            <i
                v-else
                class="bi flex-shrink-0"
                :class="open ? 'bi-caret-up-fill' : 'bi-caret-down-fill'"
            ></i>
        </div>

        <!-- Dropdown -->
        <ul
            v-if="open"
            class="dropdown-menu show w-100 p-0 shadow-sm position-absolute"
            style="
                max-height: 260px;
                overflow-y: auto;
                z-index: 1050;
                margin-top: 2px;
            "
            role="listbox"
        >
            <li v-if="filter" class="p-2 border-bottom">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :placeholder="filterPlaceholder || 'Search...'"
                    :value="query"
                    @input="query = ($event.target as HTMLInputElement).value"
                    @keydown.stop
                />
            </li>

            <li
                v-if="loading"
                class="dropdown-item text-muted text-center small py-3"
                role="option"
                aria-disabled="true"
            >
                {{ t('common.loading') }}
            </li>
            <li
                v-else-if="visibleOptions.length === 0"
                class="dropdown-item text-muted text-center small py-3"
                role="option"
                aria-disabled="true"
            >
                {{ emptyText ?? t('common.noResults') }}
            </li>

            <li
                v-for="(opt, i) in visibleOptions"
                :key="i"
                class="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                :class="{ 'bg-primary bg-opacity-10': isSelected(opt) }"
                role="option"
                :aria-selected="isSelected(opt)"
                @click="select(opt)"
                style="cursor: pointer"
            >
                <span class="d-inline-flex" style="width: 16px">
                    <i
                        v-if="isSelected(opt)"
                        class="bi bi-check text-primary"
                        style="font-size: 0.9rem"
                    ></i>
                </span>
                <slot name="option" :option="opt" :label="labelOf(opt)">
                    <span class="flex-grow-1">{{ labelOf(opt) }}</span>
                </slot>
            </li>
        </ul>
    </div>
</template>

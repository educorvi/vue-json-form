<script setup lang="ts">
import { ref } from 'vue';
import { useFormStore } from '@/stores/formStore';
import type {
    ShowOnFunctionType,
    ShowOnProperty,
    LegacyShowOnProperty,
} from '@educorvi/vue-json-form-schemas';
import FieldPathPicker from './FieldPathPicker.vue';

const props = defineProps<{
    elementId: string;
    showOn?: ShowOnProperty;
}>();

const store = useFormStore();

const legacyTypeValues: ShowOnFunctionType[] = [
    'EQUALS',
    'NOT_EQUALS',
    'GREATER',
    'GREATER_OR_EQUAL',
    'SMALLER_OR_EQUAL',
    'SMALLER',
];

const legacyTypeOptions = legacyTypeValues.map((v) => ({
    label: v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' '),
    value: v,
}));

function isLegacy(
    val: ShowOnProperty | undefined
): val is LegacyShowOnProperty {
    return !!val && 'path' in val;
}

const enabled = ref(!!props.showOn);
const mode = ref<'legacy' | 'rule'>(isLegacy(props.showOn) ? 'legacy' : 'rule');

const legacyPath = ref((props.showOn as LegacyShowOnProperty)?.path ?? '');
const legacyType = ref<ShowOnFunctionType>(
    (props.showOn as LegacyShowOnProperty)?.type ?? legacyTypeValues[0]
);
const legacyRef = ref(
    String((props.showOn as LegacyShowOnProperty)?.referenceValue ?? '')
);

const ruleJson = ref(
    props.showOn && !isLegacy(props.showOn)
        ? JSON.stringify(props.showOn, null, 2)
        : ''
);
const ruleError = ref('');

function applyChanges() {
    if (!enabled.value) {
        store.updateElement(props.elementId, { showOn: undefined } as any);
        return;
    }
    if (mode.value === 'legacy') {
        if (!legacyPath.value) return;
        let refVal: string | number | boolean = legacyRef.value;
        if (refVal === 'true') refVal = true;
        else if (refVal === 'false') refVal = false;
        else if (refVal !== '' && !isNaN(Number(refVal)))
            refVal = Number(refVal);
        store.updateElement(props.elementId, {
            showOn: {
                path: legacyPath.value,
                type: legacyType.value,
                referenceValue: refVal,
            },
        } as any);
    } else {
        ruleError.value = '';
        try {
            const parsed = JSON.parse(ruleJson.value);
            if (
                !parsed ||
                typeof parsed !== 'object' ||
                !('id' in parsed) ||
                !('rule' in parsed)
            ) {
                ruleError.value =
                    "Must be a valid Rita Rule object with 'id' and 'rule' fields.";
                return;
            }
            store.updateElement(props.elementId, { showOn: parsed } as any);
        } catch {
            ruleError.value =
                'Invalid JSON — please enter a valid Rita Rule object.';
        }
    }
}

function clearShowOn() {
    enabled.value = false;
    store.updateElement(props.elementId, { showOn: undefined } as any);
}
</script>

<template>
    <div class="vstack gap-2">
        <div class="d-flex align-items-center justify-content-between">
            <label class="text-xs text-body">Enable visibility condition</label>
            <div class="form-check form-switch mb-0">
                <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    :checked="enabled"
                    @change="
                        enabled = ($event.target as HTMLInputElement).checked;
                        if (!enabled) clearShowOn();
                    "
                />
            </div>
        </div>

        <template v-if="enabled">
            <!-- Mode toggle -->
            <div class="btn-group btn-group-sm w-100">
                <button
                    class="btn"
                    :class="mode === 'legacy' ? 'btn-primary' : 'btn-outline-secondary'"
                    @click="mode = 'legacy'"
                >Simple Rule</button>
                <button
                    class="btn"
                    :class="mode === 'rule' ? 'btn-primary' : 'btn-outline-secondary'"
                    @click="mode = 'rule'"
                >Rita Rule (JSON)</button>
            </div>

            <!-- Legacy simple rule -->
            <template v-if="mode === 'legacy'">
                <div class="vstack gap-2">
                    <div>
                        <label class="text-xs text-body mb-1 d-block">Field path</label>
                        <FieldPathPicker v-model="legacyPath" />
                    </div>
                    <div>
                        <label class="text-xs text-body mb-1 d-block">Condition</label>
                        <select
                            v-model="legacyType"
                            class="form-select form-select-sm"
                        >
                            <option
                                v-for="opt in legacyTypeOptions"
                                :key="opt.value"
                                :value="opt.value"
                            >{{ opt.label }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-xs text-body mb-1 d-block">Reference value</label>
                        <input
                            v-model="legacyRef"
                            type="text"
                            class="form-control form-control-sm"
                            placeholder="value"
                        />
                    </div>
                </div>
            </template>

            <!-- Rita rule JSON -->
            <template v-else>
                <div>
                    <label class="text-xs text-body mb-1 d-block">
                        Rita Rule JSON
                        <a
                            href="https://github.com/educorvi/rita"
                            target="_blank"
                            class="ms-1"
                        >(docs)</a>
                    </label>
                    <textarea
                        v-model="ruleJson"
                        class="form-control form-control-sm font-mono text-xs"
                        rows="6"
                        placeholder='{"id": "rule1", "rule": {"operator": "AND", "items": [...]}}'
                    />
                    <p v-if="ruleError" class="text-danger text-xs mt-1 mb-0">
                        {{ ruleError }}
                    </p>
                </div>
            </template>

            <button
                class="btn btn-primary btn-sm w-100"
                @click="applyChanges"
            >
                <i class="bi bi-check me-1" />Apply Rule
            </button>
        </template>

        <!-- Active rule display -->
        <div
            v-if="showOn"
            class="p-2 bg-warning bg-opacity-10 rounded border border-warning-subtle text-xs"
        >
            <p class="fw-medium text-warning-emphasis mb-1">
                <i class="bi bi-eye-slash me-1" />Active Rule
            </p>
            <pre class="text-xs mb-0 overflow-auto" style="max-height: 6rem">{{ JSON.stringify(showOn, null, 2) }}</pre>
        </div>
    </div>
</template>

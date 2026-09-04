<script setup lang="ts">
import { computed } from 'vue';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldTextarea from '@/components/shared/fields/FieldTextarea.vue';
import FieldSelect from '@/components/shared/fields/FieldSelect.vue';
import {
    ButtonSubmitAction,
    HttpsMethod,
    SubmitButton,
} from '@educorvi/vue-json-forms-builder-schemas';
import { useElementSettings } from './useElementSettings';
import ButtonSettings from './ButtonSettings.vue';

const { element, setField, enumField, optionalString } = useElementSettings();

const submitAction = enumField('submitAction', ButtonSubmitAction.Save);
const actionOptions = Object.values(ButtonSubmitAction);
const submitMethod = enumField<HttpsMethod>('submitMethod', HttpsMethod.POST);
const methodOptions = Object.values(HttpsMethod);
const onSuccessRedirectUrl = optionalString('onSuccessRedirectUrl');

/**
 * submitUrl is `string | string[]` (one URL or a list of URLs to send the
 * request to). The editor edits them as a list — one URL per line.
 */
const submitUrlText = computed({
    get: () => {
        const el = element.value;
        if (!(el instanceof SubmitButton)) return '';
        const v = el.data.submitUrl;
        if (v === undefined) return '';
        return Array.isArray(v) ? v.join('\n') : v;
    },
    set: (v: string) => {
        const urls = v
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
        if (urls.length === 0) setField('submitUrl', undefined);
        else if (urls.length === 1) setField('submitUrl', urls[0]);
        else setField('submitUrl', urls);
    },
});

/**
 * requestHeaders is stored as a plain object (Record<string, string>);
 * the editor edits it as a JSON text block.
 */
const requestHeadersText = computed({
    get: () => {
        const el = element.value;
        if (!(el instanceof SubmitButton)) return '';
        const headers = el.data.requestHeaders;
        return headers ? JSON.stringify(headers, null, 2) : '';
    },
    set: (v: string) => {
        if (!v.trim()) {
            setField('requestHeaders', undefined);
            return;
        }
        try {
            setField('requestHeaders', JSON.parse(v));
        } catch {
            // invalid JSON — keep the previous value until it parses
        }
    },
});
</script>

<template>
    <!-- inherited options (Button) -->
    <ButtonSettings />

    <!-- Submit-specific -->
    <SettingsSection
        title="Submit Action"
        icon="bi bi-rocket-takeoff"
        :collapsible="true"
    >
        <FieldSelect
            v-model="submitAction"
            label="Action"
            :options="actionOptions"
            field-name="submitAction"
        />
        <FieldTextarea
            v-model="submitUrlText"
            label="Submit URL(s) — one per line"
            :rows="2"
            placeholder="https://example.com/submit"
            field-name="submitUrl"
        />
        <FieldSelect
            v-model="submitMethod"
            label="Method"
            :options="methodOptions"
            field-name="submitMethod"
        />
        <FieldTextarea
            v-model="requestHeadersText"
            label="Request headers (JSON)"
            :rows="3"
            placeholder='{"X-Api-Key": "…"}'
            field-name="requestHeaders"
        />
        <FieldTextarea
            v-model="onSuccessRedirectUrl"
            label="Redirect after success"
            :rows="1"
            field-name="onSuccessRedirectUrl"
        />
    </SettingsSection>
</template>

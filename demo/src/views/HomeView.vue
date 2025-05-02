<script setup lang="ts">
import { version } from '../../package.json';
import { version as vjfVersion } from '@educorvi/vue-json-form';

const versions = [
    {
        component: 'Demo',
        version: version,
    },
    {
        component: 'Vue JSON Form',
        version: vjfVersion,
    },
];
</script>

<template>
    <h2>VJF Demo</h2>
    <p>
        This is a demo page for the Vue JSON Form library.
    </p>
    <ul>
        <li>
            Under 'Showcase' you can see a form that demonstrates some features of the library.
        </li>
        <li>
            Under 'Custom' you can upload your own schema to test it.
        </li>
        <li>
            Under 'UI Generator' you can generate a UI schema for your JSON schema.
        </li>
    </ul>
    <hr>
    <h2>Versions</h2>
    <b-table :items="versions"/>
</template>

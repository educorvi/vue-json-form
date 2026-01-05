import { type PlaywrightTestConfig } from '@playwright/test';

const reporterCI: PlaywrightTestConfig['reporter'] = [
    ['github'],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['html', { open: 'never' }],
];

export default {
    reporter: reporterCI,
};

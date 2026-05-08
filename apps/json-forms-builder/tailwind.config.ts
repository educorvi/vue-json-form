import type { Config } from 'tailwindcss';
import tailwindPrimeUI from 'tailwindcss-primeui';

export default {
    // Content paths are handled by @nuxtjs/tailwindcss automatically
    content: [],
    darkMode: ['selector', '[class~="dark"]'],
    plugins: [tailwindPrimeUI],
} satisfies Config;

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('vue-json-form')
        }
      }
    })
  ],
  build: {
    lib: {
      entry: './src/main.ce.ts',
      name: 'vue-json-form',
      // the proper extensions will be added
      fileName: 'vue-json-form'
    }
  }
})
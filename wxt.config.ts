import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: 'linkdingX',
    permissions: ['storage', 'tabs'],
    host_permissions: ['https://*/*'],
  },
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
})

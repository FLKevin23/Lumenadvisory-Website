import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:                  resolve(__dirname, 'index.html'),
        page2:                 resolve(__dirname, 'page2.html'),
        'remo-mairhofer':      resolve(__dirname, 'remo-mairhofer.html'),
        'tomasz-klimek':       resolve(__dirname, 'tomasz-klimek.html'),
        login:                 resolve(__dirname, 'login.html'),
        admin:                 resolve(__dirname, 'admin.html'),
        client:                resolve(__dirname, 'client.html'),
        'family-office':       resolve(__dirname, 'family-office.html'),
        'succession-planning': resolve(__dirname, 'succession-planning.html'),
        relocation:            resolve(__dirname, 'relocation.html'),
        philanthropy:          resolve(__dirname, 'philanthropy.html'),
        accounting:            resolve(__dirname, 'accounting.html'),
        'legal-notarial':      resolve(__dirname, 'legal-notarial.html'),
        'data-protection':     resolve(__dirname, 'data-protection.html'),
        sitemap:               resolve(__dirname, 'sitemap.html'),
        imprint:               resolve(__dirname, 'imprint.html'),
        linkedin:              resolve(__dirname, 'linkedin.html'),
      }
    }
  }
})

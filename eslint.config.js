import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Komponen yang di-destructure sebagai argumen (misal `{ icon: Icon }`
      // lalu dipakai `<Icon />`) tidak terbaca sebagai "terpakai" tanpa
      // eslint-plugin-react, jadi argsIgnorePattern disamakan dengan vars.
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' },
      ],

      // Aturan React Compiler ini melarang setState sinkron di dalam effect.
      // Seluruh panel ini mengambil data lewat `useEffect` + `setState`
      // (termasuk yang sudah dibungkus useCallback dengan benar), jadi aturan
      // tersebut menandai pola yang memang disengaja. Aktifkan lagi kalau
      // nanti pindah ke React Compiler atau library data-fetching.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])

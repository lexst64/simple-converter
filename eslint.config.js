const js = require('@eslint/js')
const globals = require('globals')
const eslintConfigPrettier = require('eslint-config-prettier')

module.exports = [
  {
    ignores: ['node_modules/**'],
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    ...js.configs.recommended,
  },
  eslintConfigPrettier,
]

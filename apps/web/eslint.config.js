// ESLint config for apps/web (SvelteKit). Extends the shared base config and
// adds the svelte flat/recommended preset so .svelte files are linted correctly.
import baseConfig from '@avkash/eslint-config';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default [
  ...baseConfig,
  // Svelte flat config — handles parser, rules, and processors for .svelte files.
  ...svelte.configs['flat/recommended'],
  // Configure the TypeScript parser for the <script lang="ts"> blocks.
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      // Svelte runes ($state, $derived, etc.) are compile-time macros, not globals.
      'no-undef': 'off',
    },
  },
  {
    ignores: ['.svelte-kit/**', 'build/**', 'node_modules/**'],
  },
];

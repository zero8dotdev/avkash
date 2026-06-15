// Shared ESLint flat-config base for the v2 monorepo. Consumed by the root
// eslint.config.js, which every package's `eslint .` resolves by walking up.
//
// Prettier owns formatting (see .prettierrc.json) — eslint-config-prettier is
// applied last to switch off any stylistic rules that would fight it, so the two
// can never disagree. The remaining rules are correctness-only (typescript-eslint
// recommended). Noisy-but-not-wrong rules are downgraded to warnings so a stray
// `any` or work-in-progress unused var never blocks a build.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/.turbo/**', '**/.next/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  prettier
);

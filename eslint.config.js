// Root ESLint flat config. ESLint 9 resolves this from any subdirectory, so each
// package's `eslint .` (and the editor's eslint LSP) shares one source of truth.
// The actual rules live in @avkash/eslint-config.
import config from '@avkash/eslint-config';

export default config;

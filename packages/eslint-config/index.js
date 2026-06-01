// Shared flat ESLint config base. Extend per-package:
//   import base from '@avkash/eslint-config'
//   export default [...base]
import tseslint from 'typescript-eslint'

export default tseslint.config(...tseslint.configs.recommended, {
  ignores: ['dist/**', '.turbo/**', 'node_modules/**'],
})

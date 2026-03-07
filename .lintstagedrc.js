const path = require('path');

const buildEslintCommand = (filenames) =>
  `next lint --fix  --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`;

module.exports = {
  // Type check TypeScript files
  '*/.(ts|tsx)': () => 'yarn tsc --noEmit',
  '*.{js,jsx,ts,tsx,json,md,prettierrc,css,scss}': 'prettier --write',
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
};

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const globals = Object.fromEntries(
  [
    'process',
    'console',
    'Buffer',
    'URL',
    'AbortController',
    'AbortSignal',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'fetch',
  ].map((name) => [name, 'readonly']),
);
const files = ['apps/**/*.ts', 'packages/**/*.ts'];
export default [
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  { ...js.configs.recommended, files: ['**/*.mjs'], languageOptions: { globals } },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({ ...config, files })),
  {
    files,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: dirname(fileURLToPath(import.meta.url)),
      },
    },
    rules: { '@typescript-eslint/consistent-type-imports': 'error' },
  },
];

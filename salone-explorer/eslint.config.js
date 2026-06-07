// ESLint flat config (ESLint 9+): TypeScript + React Hooks + jsx-a11y
// (recommended) + react-refresh. Migrated from .eslintrc.cjs. jsx-a11y errors
// fail the build per SPEC §10.5; never eslint-disable them. Rule set is
// preserved 1:1 from the eslintrc version.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  // Build artifacts and vendored code are never linted. supabase/functions is
  // Deno code (remote imports, Deno globals) with its own toolchain (deno
  // lint); its testable logic lives in _shared/*.ts and is covered by vitest +
  // tsc via the app's test imports.
  { ignores: ['dist', 'dist-ssr', 'node_modules', 'coverage', 'supabase/functions'] },

  // Base recommended sets (equivalent to the old `extends`).
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  reactHooks.configs['recommended-latest'],

  // Project language options + the three custom TypeScript rules and the
  // react-refresh opt-out (data-router loaders / cva variants co-locate with
  // components; fast-refresh boundaries are a dev concern, not a quality gate).
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);

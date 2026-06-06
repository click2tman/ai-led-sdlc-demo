// ESLint config: TypeScript + React Hooks + jsx-a11y (recommended).
// jsx-a11y errors fail the build per SPEC §10.5; never eslint-disable them.
/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  settings: { react: { version: '18' } },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.cjs', 'vite.config.ts'],
  rules: {
    // Off by design: react-router's data-router pattern co-locates `loader`
    // exports with route components, and cva variants live beside their
    // component. Fast-refresh boundaries are a dev-only concern, not a
    // quality gate. This is not a jsx-a11y rule.
    'react-refresh/only-export-components': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};

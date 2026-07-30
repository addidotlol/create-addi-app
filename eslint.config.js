import js from '@eslint/js';
import nodePlugin from 'eslint-plugin-n';
import globals from 'globals';

export default [
  js.configs.recommended,
  nodePlugin.configs['flat/recommended-module'],
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'n/no-missing-import': 'off',
      'n/no-extraneous-import': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-unpublished-require': 'off',
      'prefer-const': 'error',
      'no-unused-vars': 'error',
      'no-console': 'off',
      'n/no-process-exit': 'off',
    },
  },
  {
    ignores: ['test-app/', 'templates/'],
  },
];

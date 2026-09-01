export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'src/**/*.ts', 'tests/**/*.ts', 'App.tsx'],
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        AudioContext: 'readonly',
        Blob: 'readonly',
        Date: 'readonly',
        Intl: 'readonly',
        JSON: 'readonly',
        Math: 'readonly',
        Object: 'readonly',
        Set: 'readonly',
        String: 'readonly',
        URL: 'readonly',
        document: 'readonly',
        globalThis: 'readonly',
        history: 'readonly',
        localStorage: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      'no-constant-condition': 'error',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
    },
  },
];

module.exports = [{
  ignores: ['node_modules/**', '.expo/**', 'android/**', 'ios/**', 'dist/**', 'build/**', 'coverage/**'],
}, {
  files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
  languageOptions: {
    ecmaVersion: 'latest',
    globals: {
      NodeFilter: 'readonly',
    },
  },
}];

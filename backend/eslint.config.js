const eslint = require('eslint');

module.exports = [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      'indent': 'off',
      'linebreak-style': 'off',
      'quotes': 'off',
      'semi': 'off',
      'no-unused-vars': 'off',
      'no-console': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'eqeqeq': 'off',
      'curly': 'off',
      'brace-style': 'off',
      'comma-dangle': 'off',
      'arrow-spacing': 'off',
    },
  },
];

import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules', 'public'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // DTO/props của dự án chưa dùng PropTypes/TS → tắt để tránh nhiễu
      'react/prop-types': 'off',
      // inline style + thuộc tính tùy biến nhiều → không cảnh báo
      'react/no-unknown-property': 'off',
      // Text tiếng Việt có dấu nháy " ' trong JSX → render bình thường
      'react/no-unescaped-entities': 'off',
      // catch {} cố ý bỏ qua lỗi là pattern hợp lệ trong dự án
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Cho phép biến viết HOA (hằng) hoặc _ chưa dùng
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
];

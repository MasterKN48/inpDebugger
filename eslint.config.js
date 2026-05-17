import reactPlugin from 'eslint-plugin-react';

export default [
  // 1. Global directory and file ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.tauri/**',
      '**/.tauri-build/**',
      'inpdebugger.db',
      'apps/desktop/src-tauri/**',
    ],
  },
  
  // 2. Syntax, quality, and style rules across the monorepo
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Frontend Browser execution context
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        URL: 'readonly',
        Image: 'readonly',
        Blob: 'readonly',
        // Backend & Build execution context (Node/Bun)
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'readonly',
        // Preact specific globals
        React: 'readonly',
        h: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
    },
    rules: {
      // General JavaScript Code Quality Rules
      'no-unused-vars': [
        'warn',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'no-undef': 'error',
      'no-console': 'off', // Pino and console logging is central to diagnostics
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-const-assign': 'error',
      'no-class-assign': 'error',
      
      // JSX & React/Preact Specific Rules
      'react/jsx-uses-react': 'off', // Modern JSX transform doesn't require importing React/h
      'react/jsx-uses-vars': 'error',
    },
    settings: {
      react: {
        pragma: 'h', // Tell ESLint to use Preact's pragma
        version: '10.19',
      },
    },
  },
];

import nx from '@nx/eslint-plugin';

// Module 1, scene 1: no architecture contract. Anything may depend on anything (the Nx default).
const depConstraints = [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }];

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/.nx',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints,
        },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // House rules that are mechanical enough to be lint, not judgement.
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'max-lines': [
        'error',
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
      'prefer-const': 'error',
      // Security rules mechanical enough to be lint (module 5). The judgement ones live in AGENTS.md and in the scan.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.property.name=/^bypassSecurityTrust/]',
          message:
            "Never bypass Angular's sanitizer. Render text, or map a whitelisted subset to elements in the template.",
        },
        {
          selector:
            "CallExpression[callee.name='fetch'] Literal[value=/^https?:\\/\\//]",
          message:
            'The browser never calls a third party directly. Go through the backend (FakeBackend here, your API in production).',
        },
      ],
    },
  },
  {
    // The legacy corner is frozen: old code stays as-is until a task file says "migrate".
    files: ['libs/legacy/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@angular-eslint/prefer-standalone': 'off',
      '@angular-eslint/prefer-inject': 'off',
      'max-lines': 'off',
    },
  },
  {
    // The AngularJS corner is frozen the same way. Its templates are strings: no Angular template rule ever reads them.
    files: ['libs/angularjs/**/*.ts'],
    ignores: ['**/*-host.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines': 'off',
    },
  },
  {
    files: ['libs/legacy/**/*.html'],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'off',
      '@angular-eslint/template/label-has-associated-control': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/test-setup.ts'],
    rules: { 'max-lines': 'off' },
  },
];

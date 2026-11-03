import nx from '@nx/eslint-plugin';

// Architecture as an executable contract.
// Every lib carries exactly one scope:* and one type:* tag (see project.json).
// The agent must make `npm run lint:arch` pass before it is done — see AGENTS.md.
const depConstraints = [
  { sourceTag: 'scope:domain', onlyDependOnLibsWithTags: ['scope:domain'] },
  {
    sourceTag: 'scope:atlas',
    onlyDependOnLibsWithTags: ['scope:atlas', 'scope:domain'],
  },

  { sourceTag: 'type:domain', onlyDependOnLibsWithTags: ['type:domain'] },
  {
    sourceTag: 'type:data-access',
    onlyDependOnLibsWithTags: ['type:data-access', 'type:domain'],
  },
  {
    sourceTag: 'type:ui',
    onlyDependOnLibsWithTags: ['type:ui', 'type:domain'],
  },
  {
    sourceTag: 'type:feature',
    onlyDependOnLibsWithTags: [
      'type:feature',
      'type:ui',
      'type:data-access',
      'type:domain',
    ],
  },
  {
    sourceTag: 'type:legacy',
    onlyDependOnLibsWithTags: [
      'type:legacy',
      'type:data-access',
      'type:domain',
    ],
  },
  {
    sourceTag: 'type:legacy-ajs',
    onlyDependOnLibsWithTags: [
      'type:legacy-ajs',
      'type:ui',
      'type:data-access',
      'type:domain',
    ],
  },
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: [
      'type:feature',
      'type:ui',
      'type:data-access',
      'type:domain',
      'type:legacy',
      'type:legacy-ajs',
    ],
  },
];

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
    files: ['**/*.spec.ts', '**/test-setup.ts'],
    rules: { 'max-lines': 'off' },
  },
];

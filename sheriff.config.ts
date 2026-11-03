import { noDependencies, sameTag, SheriffConfig } from '@softarc/sheriff-core';

// The same architecture contract as eslint.config.mjs, expressed with Sheriff.
// Shown in the workshop for teams that are not on Nx: Sheriff tags folders by convention
// and works in a plain Angular CLI project. Run: `npm run lint:arch:sheriff`.
export const sheriffConfig: SheriffConfig = {
  version: 1,
  entryFile: 'apps/atlas/src/main.ts',
  excludeRoot: true,
  tagging: {
    'apps/atlas/src': ['type:app'],
    'libs/domain/src': ['type:domain'],
    'libs/data-access/<name>/src': ['type:data-access'],
    'libs/ui/src': ['type:ui'],
    'libs/feature/<name>/src': ['type:feature'],
    'libs/angularjs/<name>/src': ['type:legacy-ajs'],
  },
  depRules: {
    // apps/atlas/src/main.ts and the app shell live at the root (no index.ts): the app may mount anything
    root: [
      'noTag',
      'type:app',
      'type:feature',
      'type:ui',
      'type:data-access',
      'type:domain',
      'type:legacy',
      'type:legacy-ajs',
    ],
    noTag: ['noTag', 'root'],
    'type:domain': noDependencies,
    'type:data-access': [sameTag, 'type:domain'],
    'type:ui': [sameTag, 'type:domain'],
    'type:feature': [sameTag, 'type:ui', 'type:data-access', 'type:domain'],
    'type:legacy': [sameTag, 'type:data-access', 'type:domain'],
    'type:legacy-ajs': [sameTag, 'type:ui', 'type:data-access', 'type:domain'],
    'type:app': [
      'type:feature',
      'type:ui',
      'type:data-access',
      'type:domain',
      'type:legacy',
      'type:legacy-ajs',
    ],
  },
};

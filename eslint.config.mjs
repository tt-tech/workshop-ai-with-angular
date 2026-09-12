import nx from "@nx/eslint-plugin";

// Architecture as an executable contract.
// Every lib carries exactly one scope:* and one type:* tag (see project.json).
// The agent must make `npm run lint:arch` pass before it is done — see AGENTS.md.
// Scene 1: no architecture contract — anything may depend on anything (the Nx default).
const depConstraints = [{ sourceTag: "*", onlyDependOnLibsWithTags: ["*"] }];

export default [
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/javascript"],
  {       "ignores": [
        "**/dist",
        "**/out-tsc",
        "**/.nx",
        "**/vitest.config.*.timestamp*"
      ] },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: ["^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$"],
          depConstraints,
        },
      ],
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      // House rules that are mechanical enough to be lint, not judgement.
      "@typescript-eslint/no-explicit-any": "error",
      "eqeqeq": ["error", "always"],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "prefer-const": "error",
    },
  },
  {
    // The legacy corner is frozen: old code stays as-is until a task file says "migrate".
    files: ["libs/legacy/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@angular-eslint/prefer-standalone": "off",
      "@angular-eslint/prefer-inject": "off",
      "max-lines": "off",
    },
  },
  {
    files: ["libs/legacy/**/*.html"],
    rules: {
      "@angular-eslint/template/prefer-control-flow": "off",
      "@angular-eslint/template/label-has-associated-control": "off",
    },
  },
  {
    files: ["**/*.spec.ts", "**/test-setup.ts"],
    rules: { "max-lines": "off" },
  },
];

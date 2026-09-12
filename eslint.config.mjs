import nx from "@nx/eslint-plugin";

// Architecture as an executable contract.
// Every lib carries exactly one scope:* and one type:* tag (see project.json).
// The agent must make `npm run lint:arch` pass before it is done — see AGENTS.md.
const depConstraints = [
  { sourceTag: "scope:domain", onlyDependOnLibsWithTags: ["scope:domain"] },
  { sourceTag: "scope:atlas", onlyDependOnLibsWithTags: ["scope:atlas", "scope:domain"] },

  { sourceTag: "type:domain", onlyDependOnLibsWithTags: ["type:domain"] },
  { sourceTag: "type:data-access", onlyDependOnLibsWithTags: ["type:data-access", "type:domain"] },
  { sourceTag: "type:ui", onlyDependOnLibsWithTags: ["type:ui", "type:domain"] },
  { sourceTag: "type:feature", onlyDependOnLibsWithTags: ["type:feature", "type:ui", "type:data-access", "type:domain"] },
  { sourceTag: "type:legacy", onlyDependOnLibsWithTags: ["type:legacy", "type:data-access", "type:domain"] },
  { sourceTag: "type:app", onlyDependOnLibsWithTags: ["type:feature", "type:ui", "type:data-access", "type:domain", "type:legacy"] },
];

export default [
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/javascript"],
  { ignores: ["**/dist", "**/out-tsc", "**/.nx"] },
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
    },
  },
  {
    files: ["**/*.spec.ts", "**/test-setup.ts"],
    rules: { "max-lines": "off" },
  },
];

/**
 * @file commitlint.config.mjs
 * @description
 * Commit-message rules for the academorix-frontend monorepo.
 *
 * Extends `@commitlint/config-conventional` (Conventional Commits) with
 * workspace-specific type + scope enums for enterprise-grade traceability.
 *
 * Format: `<type>(<scope>): <subject>`
 *   type   — kebab-case, from `type-enum` below
 *   scope  — kebab-case, from `scope-enum` below (optional)
 *   subject — imperative mood, no trailing period
 *
 * Header capped at 100 chars. Body/footer optional.
 *
 * @see https://commitlint.js.org/reference/rules.html
 * @type {import("@commitlint/types").UserConfig}
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Header length — 100 chars matches printWidth from the prettier config.
    "header-max-length": [2, "always", 100],

    // Type must be one of these — extends conventional's defaults with
    // enterprise-grade additions.
    "type-enum": [
      2,
      "always",
      [
        // Feature work
        "feat", // A new feature
        "fix", // A bug fix
        "perf", // Performance improvement
        // Refactor / hygiene
        "refactor", // Code refactor (no behavior change)
        "revert", // Revert of an earlier commit
        "style", // Formatting / whitespace / lint-only
        // Test / infra
        "test", // Adding or updating tests
        "build", // Build system, tsup, tsconfig, vite config
        "ci", // CI/CD pipeline changes
        "chore", // Chores, misc maintenance
        // Docs / dependencies
        "docs", // Documentation only
        "deps", // Dependency updates (pnpm, catalog)
        // Release
        "release", // Version bumps, changesets
      ],
    ],

    // Scope must be kebab-case. Not enforced against an enum (too many
    // workspace packages) — kebab-case is enough discipline.
    "scope-case": [2, "always", "kebab-case"],

    // Subject: no capital letter start, no trailing period, imperative.
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],

    // Body / footer — encourage but don't enforce.
    "body-leading-blank": [1, "always"],
    "footer-leading-blank": [1, "always"],
    "body-max-line-length": [1, "always", 200],
    "footer-max-line-length": [1, "always", 200],
  },
};

/**
 * ESLint configuration for Dashify (Next.js 13, ESLint 8, JavaScript).
 *
 * Mirrors the rule set from eCommerce-core/eslint.config.mjs, adapted for:
 *  - JavaScript (no TypeScript rules)
 *  - Next.js 13 legacy config format (flat config requires ESLint 9)
 */

module.exports = {
  extends: [
    'next/core-web-vitals',
    // Prettier last — disables ESLint rules that conflict with Prettier formatting
    'plugin:prettier/recommended',
  ],

  ignorePatterns: [
    '.next/',
    'node_modules/',
    'public/',
    'scripts/',
    'next.config.js',
    'postcss.config.js',
    'tailwind.config.js',
  ],

  rules: {
    // ── Next.js overrides ───────────────────────────────────────────────────
    '@next/next/no-img-element': 'off', // project uses <img> in several components

    // ── JavaScript quality (mirrors eCommerce-core server rules) ────────────
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-undef': 'off',              // Next.js globals are handled by eslint-config-next
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-duplicate-imports': 'error',

    // ── React hooks ─────────────────────────────────────────────────────────
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ── Prettier ─────────────────────────────────────────────────────────────
    'prettier/prettier': 'error',   // surfaces formatting issues as lint errors
  },
}

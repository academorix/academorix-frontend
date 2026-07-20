/**
 * @file jest.config.js
 * @description
 * Jest config for the react-native-template app. Extends the RN
 * preset with `transformIgnorePatterns` adjusted for pnpm's `.pnpm/`
 * store layout — the default RN preset only whitelists paths of the
 * shape `node_modules/@react-native/...`, but pnpm keeps every
 * package under `node_modules/.pnpm/@react-native+<pkg>@<ver>/node_modules/@react-native/...`
 * which the default regex misses, so Jest tries to run the untransformed
 * ESM through Node and crashes on `import { ... } from '...'` at boot.
 */
module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    // Same shape as the RN default, but with the `.pnpm/...+@` prefix
    // allowed so pnpm-installed RN packages get Babel-transformed too.
    'node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:jest-)?@?react-native|@react-navigation)',
  ],
};

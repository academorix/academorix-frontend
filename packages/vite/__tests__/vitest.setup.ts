/**
 * @file vitest.setup.ts
 * @module @stackra/vite/test
 * @description Vitest setup file. Currently just seeds
 *   `reflect-metadata` so any future DI-adjacent code path — a
 *   plugin factory that installs decorators, a virtual-module
 *   generator that reads container metadata — has the runtime
 *   shim available. No-op for the v0 surface, which uses no
 *   decorators.
 */

import "reflect-metadata";

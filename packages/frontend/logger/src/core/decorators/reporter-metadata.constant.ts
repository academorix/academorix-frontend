/**
 * @file reporter-metadata.constant.ts
 * @module @stackra/logger/core/decorators
 *
 * @description
 * Legacy re-export of the reporter metadata key. The canonical
 * declaration now lives in `@stackra/contracts` as
 * `LOGGER_REPORTER_METADATA_KEY`, aligning with the framework-wide
 * `stackra:<domain>:<name>` convention.
 *
 * New code should import `LOGGER_REPORTER_METADATA_KEY` directly
 * from `@stackra/contracts`. This shim keeps the historical name
 * `REPORTER_METADATA_KEY` working for existing imports.
 */

export { LOGGER_REPORTER_METADATA_KEY as REPORTER_METADATA_KEY } from "@stackra/contracts";

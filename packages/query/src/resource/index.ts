/**
 * @file index.ts
 * @module @academorix/query/resource
 *
 * @description
 * Public barrel for the resource-hooks factory + types.
 */

export { defineResource } from "./define-resource";
export type { DefineResourceOptions, ResourceHooks } from "./define-resource";
export type { ResourceDefinition, ResourceListParams, ResourceListResult } from "./resource.type";
export { serializeListParams } from "./serialize-params.util";

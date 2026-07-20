/**
 * @file operation-type.enum.ts
 * @module @stackra/contracts/enums
 * @description CRUD operation type recorded on a queued sync operation.
 */

/**
 * The kind of change captured by a queued operation.
 */
export enum OperationType {
  Create = "create",
  Update = "update",
  Delete = "delete",
}

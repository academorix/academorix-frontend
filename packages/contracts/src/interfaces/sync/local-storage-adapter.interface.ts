/**
 * @file local-storage-adapter.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Minimal local storage contract for the sync engine.
 */

/**
 * Minimal local storage contract for sync operations.
 *
 * The sync engine only needs basic CRUD to apply pulled changes and merge
 * conflicts, so the interface stays small on purpose. Any storage backend
 * that satisfies it can be plugged in — an ORM DataAdapter, a raw IndexedDB
 * wrapper, or an in-memory store for tests.
 */
export interface ILocalStorageAdapter {
  /**
   * Find a single document by its primary key.
   *
   * @param collection - Collection / table name.
   * @param id - Primary key value.
   * @returns The document, or `null` when not found.
   */
  findOne<T>(collection: string, id: string | number): Promise<T | null>;

  /**
   * Insert a new document.
   *
   * @param collection - Collection / table name.
   * @param data - Document data to insert.
   * @returns The inserted document.
   */
  insert<T>(collection: string, data: T): Promise<T>;

  /**
   * Update an existing document by primary key.
   *
   * @param collection - Collection / table name.
   * @param id - Primary key value.
   * @param data - Partial patch to merge into the document.
   * @returns The updated document.
   */
  update<T>(collection: string, id: string | number, data: Partial<T>): Promise<T>;

  /**
   * Insert multiple documents in a batch (optional — falls back to a loop
   * over {@link insert} when the adapter does not implement it).
   *
   * @param collection - Collection / table name.
   * @param data - Documents to insert.
   * @returns The inserted documents.
   */
  insertMany?<T>(collection: string, data: T[]): Promise<T[]>;
}

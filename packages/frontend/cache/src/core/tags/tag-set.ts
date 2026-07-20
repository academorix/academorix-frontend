/**
 * @file tag-set.ts
 * @module @stackra/cache/core/tags
 * @description Manages a set of cache tags with unique identifiers.
 *   Each tag is assigned a random ID stored in the cache. When a tag is
 *   "flushed", its ID is rotated — causing all keys namespaced with the
 *   old ID to become unreachable (effectively invalidated).
 *
 *   This is the mechanism behind tag-based cache invalidation: rather than
 *   tracking every key associated with a tag, we change the namespace
 *   prefix so old keys simply can't be found anymore.
 */
import type { ICacheStore } from "@stackra/contracts";
import { requireStoreMethod } from "@/core/utils/require-store-method.util";

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * A set of cache tags that collectively form a namespace.
 *
 * Each tag has a unique ID stored in the cache under `tag:{name}:key`.
 * The namespace is the concatenation of all tag IDs (pipe-separated),
 * then hashed to produce a fixed-length prefix for tagged cache keys.
 *
 * Flushing a tag rotates its ID, instantly invalidating all entries
 * stored under the old namespace — without needing to enumerate keys.
 *
 * @example
 * ```typescript
 * const tagSet = new TagSet(store, ['users', 'profiles']);
 * const namespace = await tagSet.getNamespace();
 * // Keys are prefixed: `${sha(namespace)}:actual-key`
 *
 * // Invalidate all entries tagged with 'users':
 * await tagSet.reset(); // rotates tag IDs → old namespace unreachable
 * ```
 */
export class TagSet {
  /**
   * Create a new TagSet.
   *
   * @param store - The underlying cache store for persisting tag IDs
   * @param names - The tag names in this set
   */
  public constructor(
    private readonly store: ICacheStore,
    private readonly names: string[],
  ) {}

  // ══════════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Reset all tags in the set by rotating their IDs.
   *
   * This effectively invalidates all cache entries stored under the
   * current namespace, because the namespace changes when any tag ID
   * rotates. Entries are NOT deleted — they become orphaned and will
   * be cleaned up by the store's TTL expiry or eviction policy.
   */
  public async reset(): Promise<void> {
    for (const name of this.names) {
      await this.resetTag(name);
    }
  }

  /**
   * Flush (remove) all tag ID entries from the store.
   *
   * Unlike `reset()` which rotates IDs, this completely removes the
   * tag metadata. Next access will generate fresh IDs.
   */
  public async flush(): Promise<void> {
    const deleteFn = requireStoreMethod(this.store, "delete");
    for (const name of this.names) {
      await deleteFn(this.tagKey(name));
    }
  }

  /**
   * Get the unique namespace for this tag set.
   *
   * The namespace is a pipe-separated concatenation of all tag IDs.
   * It changes whenever any tag in the set is reset/flushed.
   *
   * @returns The composite namespace string
   */
  public async getNamespace(): Promise<string> {
    const ids = await this.tagIds();
    return ids.join("|");
  }

  /**
   * Get the tag names in this set.
   *
   * @returns Array of tag name strings
   */
  public getNames(): string[] {
    return [...this.names];
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get the unique IDs for all tags in the set.
   *
   * If a tag doesn't have an ID yet, one is generated and stored.
   *
   * @returns Array of tag IDs (one per tag name)
   */
  private async tagIds(): Promise<string[]> {
    const ids: string[] = [];
    for (const name of this.names) {
      ids.push(await this.tagId(name));
    }
    return ids;
  }

  /**
   * Get (or generate) the unique ID for a single tag.
   *
   * @param name - The tag name
   * @returns The tag's unique ID
   */
  private async tagId(name: string): Promise<string> {
    const existing = await this.store.get<string>(this.tagKey(name));
    if (existing) return existing;
    return this.resetTag(name);
  }

  /**
   * Reset a single tag by generating a new unique ID.
   *
   * The new ID is stored permanently (no TTL) under the tag's key.
   *
   * @param name - The tag name to reset
   * @returns The newly generated tag ID
   */
  private async resetTag(name: string): Promise<string> {
    const id = this.generateId();
    await requireStoreMethod(this.store, "forever")(this.tagKey(name), id);
    return id;
  }

  /**
   * Build the storage key for a tag's ID.
   *
   * @param name - The tag name
   * @returns The fully qualified key (e.g., 'tag:users:key')
   */
  private tagKey(name: string): string {
    return `tag:${name}:key`;
  }

  /**
   * Generate a unique random identifier for a tag.
   *
   * Uses a combination of timestamp and random bytes for uniqueness.
   * Does NOT need to be cryptographically secure — just unique.
   *
   * @returns A random alphanumeric string
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}${random}`;
  }
}

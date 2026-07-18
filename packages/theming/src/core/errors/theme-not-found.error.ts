/**
 * @file theme-not-found.error.ts
 * @module @stackra/theming/errors
 * @description Thrown when setTheme(id) references an unregistered preset.
 */

// ============================================================================
// Error Class
// ============================================================================

/**
 * Thrown when `setTheme(id)` references an unregistered preset.
 *
 * Lists available theme IDs in the error message to assist debugging.
 */
export class ThemeNotFoundError extends Error {
  /**
   * @param id - The theme ID that was not found.
   * @param available - Array of registered theme IDs.
   */
  public constructor(id: string, available: string[] = []) {
    const availableList = available.length > 0 ? ` Available: ${available.join(', ')}.` : '';
    super(`[Theming] Theme "${id}" is not registered in the ThemeRegistry.${availableList}`);
    this.name = 'ThemeNotFoundError';
  }
}

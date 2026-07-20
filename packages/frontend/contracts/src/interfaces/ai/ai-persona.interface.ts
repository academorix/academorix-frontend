/**
 * @file ai-persona.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description A backend agent/persona scoping the AI's behavior and
 *   permissions.
 */

/** A client-declared persona/agent. */
export interface IPersona {
  /** Unique persona slug. */
  slug: string;
  /** Display title. */
  title: string;
  /** Optional description. */
  description?: string;
  /** Roles the persona is permitted to act under. */
  roles?: string[];
  /** Whether the persona runs as a background agent. */
  background?: boolean;
}

/**
 * Alias for {@link IPersona} — a persona is also referred to as an agent
 * (declared with the `@AiAgent` decorator).
 */
export type IAiAgent = IPersona;

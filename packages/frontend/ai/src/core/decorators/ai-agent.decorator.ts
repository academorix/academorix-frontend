/**
 * @file ai-agent.decorator.ts
 * @module @stackra/ai/core/decorators
 * @description `@AiAgent(persona)` — marks an `@Injectable()` class as an
 *   AI persona/agent for auto-discovery.
 *
 *   Personas keep the decorator + discovery model (rather than the hook
 *   model used for client tools and context frames) because they are
 *   headless and app-global — they carry no live component state and fit
 *   dependency-injection discovery naturally (Req 14, Design Decision 4).
 *
 * @example
 * ```typescript
 * import { Injectable } from '@stackra/container';
 * import { AiAgent } from '@stackra/ai';
 *
 * @AiAgent({ slug: 'analyst', title: 'Analyst', description: 'Data insights.' })
 * @Injectable()
 * export class AnalystAgent {}
 * ```
 */

import 'reflect-metadata';
import { AI_AGENT_METADATA, type IPersona } from '@stackra/contracts';

/**
 * Marks a class as a discoverable AI persona.
 *
 * @param persona - Persona metadata (slug, title, description, roles, …).
 * @returns A class decorator.
 */
export function AiAgent(persona: IPersona): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(AI_AGENT_METADATA, persona, target);
  };
}

/**
 * Read the persona metadata stamped by `@AiAgent(...)` on a class.
 *
 * @param target - The class constructor to inspect.
 * @returns The persona metadata, or `undefined` when the class is not
 *   decorated.
 */
export function getAiAgentMetadata(target: Function): IPersona | undefined {
  return Reflect.getMetadata(AI_AGENT_METADATA, target) as IPersona | undefined;
}

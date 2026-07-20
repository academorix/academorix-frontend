/**
 * @file ai-config.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Resolved AI runtime configuration (held under `AI_CONFIG`).
 */

import type { IAiAuthProvider } from "./ai-auth-provider.interface";
import type { IPersona } from "./ai-persona.interface";

/** A PII-redaction rule applied to context frames before sync. */
export interface IPiiRule {
  /** Frame field/path to redact. */
  field?: string;
  /** Pattern (string form of a regular expression) to match values against. */
  pattern?: string;
  /** Replacement token substituted for matched values. */
  replacement?: string;
}

/** Context-collection configuration. */
export interface IAiContextConfig {
  /** Debounce window for context syncs, in milliseconds. */
  debounceMs?: number;
  /** Whether syncs are gated to the multi-tab leader. */
  leaderGated?: boolean;
  /** Maximum serialized size per context frame, in bytes. */
  maxFrameBytes?: number;
  /** Maximum serialized size of the aggregate snapshot, in bytes. */
  maxSnapshotBytes?: number;
  /** PII-redaction rules. */
  piiRules?: IPiiRule[];
}

/** Bounded exponential-backoff retry policy for reconnection. */
export interface IAiRetryPolicy {
  /** Maximum reconnection attempts. */
  maxAttempts: number;
  /** Base backoff delay, in milliseconds. */
  baseMs: number;
  /** Maximum backoff delay cap, in milliseconds. */
  capMs: number;
}

/** Optional speech feature toggles. */
export interface IAiSpeechConfig {
  /** Enable speech-to-text transcription. */
  transcribe?: boolean;
  /** Enable text-to-speech synthesis. */
  tts?: boolean;
}

/** The resolved AI configuration. */
export interface IAiConfig {
  /** Backend base URL. */
  baseUrl: string;
  /** `@stackra/http` connection name. */
  connection?: string;
  /** Default transport binding hint (the platform module decides). */
  transport?: "sse" | "ws";
  /** Consumer-supplied credentials provider. */
  authProvider: IAiAuthProvider;
  /** Context-collection configuration. */
  context?: IAiContextConfig;
  /** Reconnection retry policy. */
  retryPolicy?: IAiRetryPolicy;
  /** Declaratively-provided personas. */
  personas?: IPersona[];
  /** Speech feature toggles. */
  speech?: IAiSpeechConfig;
}

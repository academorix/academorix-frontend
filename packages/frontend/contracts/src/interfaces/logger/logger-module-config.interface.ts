/**
 * @file logger-module-config.interface.ts
 * @module @stackra/contracts/interfaces/logger
 * @description Logger module configuration shape.
 */

import type { LogLevel } from "@/enums/log-level.enum";

/** Configuration for a single log channel. */
export interface ILogChannelConfig {
  /** Channel driver/type (e.g., 'stack', 'single', 'daily'). */
  driver?: string;
  /** Channel type alias (same as driver). */
  type?: string;
  /** Minimum level for this channel. */
  level?: LogLevel | string;
  /** Reporter names to use for this channel. */
  reporters?: string[];
  /** Formatter name for this channel. */
  formatter?: string;
  /** Channels to aggregate (for 'stack' driver). */
  channels?: string[];
}

/** Channel tap configuration — mirrors entries to another channel. */
export interface IChannelTapConfig {
  /** Target channel name to mirror entries to. */
  channel: string;
  /** Optional level filter for the tap. */
  level?: LogLevel | string;
}

/** Full logger module configuration. */
export interface ILoggerModuleConfig {
  /** Default channel name. */
  default: string;
  /** Named channel configurations. */
  channels: Record<string, ILogChannelConfig>;
  /** Global minimum level (overridable per channel). */
  level?: LogLevel | string;
  /** Redaction configuration for sensitive data masking. */
  redact?: {
    /** Fields to redact from log entries. */
    paths: string[];
    /** Replacement string for redacted values. */
    censor?: string;
  };
  /** Global context to attach to all log entries. */
  globalContext?: Record<string, unknown>;
}

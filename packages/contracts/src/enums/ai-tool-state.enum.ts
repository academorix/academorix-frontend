/**
 * @file ai-tool-state.enum.ts
 * @module @stackra/contracts/enums
 * @description Render state of a tool call. Deliberately mirrors HeroUI Pro
 *   `ChatTool`'s `state` union so no adapter sits between the model and the UI.
 */

/** Render state of an AI tool call. */
export enum AiToolState {
  /** Input arguments are still streaming. */
  InputStreaming = "input-streaming",
  /** Input arguments are fully available. */
  InputAvailable = "input-available",
  /** A successful result is available. */
  OutputAvailable = "output-available",
  /** The tool produced an error result. */
  OutputError = "output-error",
  /** The tool call awaits user approval/rejection. */
  RequiresAction = "requires-action",
}

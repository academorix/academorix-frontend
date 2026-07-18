/**
 * @file index.ts
 * @module @stackra/ai/native/components
 * @description React Native equivalents of the wired `@stackra/ai/react`
 *   components. Built on `react-native` primitives (declared as an
 *   optional peer dependency) so headless consumers of `@stackra/ai`
 *   are not forced to install React Native.
 *
 *   Every visual component is hooks-driven — the same `useAiChat`,
 *   `useAiThreads`, and orchestrator flow that powers the web surface.
 *   No web-only APIs (DOM, ARIA `aria-live`) leak in; the accessibility
 *   layer uses `accessibilityRole`, `accessibilityLabel`, and
 *   `accessibilityLiveRegion` instead.
 */

export { AiChat } from './ai-chat';
export type { IAiChatProps } from './ai-chat';

export { AiLoader } from './ai-loader';
export type { AiLoaderVariant, IAiLoaderProps } from './ai-loader';

export { AiMessage } from './ai-message';
export type { IAiMessageProps } from './ai-message';

export { AiPrompt } from './ai-prompt';
export type { IAiPromptProps } from './ai-prompt';

export { AiThreadList } from './ai-thread-list';
export type { IAiThreadListProps } from './ai-thread-list';

export { AiToolCall } from './ai-tool-call';
export type { IAiToolCallProps } from './ai-tool-call';

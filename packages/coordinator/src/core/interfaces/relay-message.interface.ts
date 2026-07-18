/**
 * @file relay-message.interface.ts
 * @module @stackra/coordinator/core/interfaces
 * @description Defines the IRelayMessage interface.
 */
export interface IRelayMessage {
  kind: 'event-relay';
  event: string;
  args: unknown[];
  sourceTabId: string;
}

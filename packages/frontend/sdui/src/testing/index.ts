/**
 * @file index.ts
 * @module @stackra/sdui/testing
 * @description Test doubles + fixtures for `@stackra/sdui`.
 */

export {
  createMockSduiClient,
  type IMockSduiClient,
  type IMockSduiClientScript,
} from "./create-mock-client";
export {
  sduiTestScreens,
  emptyScreen,
  heroScreen,
  unknownComponentScreen,
  outOfRangeScreen,
} from "./screens";

/**
 * @file index.ts
 * @module @academorix/http/device
 *
 * @description
 * Public barrel for the device-header reader.
 */

export { createDeviceHeadersReader, deviceLabel } from "./device-headers.util";
export type { DeviceHeadersOptions } from "./device-headers.util";
export { getDeviceLocale } from "./locale.util";

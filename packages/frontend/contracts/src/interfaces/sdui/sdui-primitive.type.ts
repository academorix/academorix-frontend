/**
 * @file sdui-primitive.type.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Scalar + JSON-value type aliases that appear as leaves
 *   throughout the SDUI wire contract.
 */

/** JSON scalar. */
export type SduiScalar = string | number | boolean | null;

/** Any JSON-serializable value. */
export type SduiJsonValue = SduiScalar | SduiJsonValue[] | { [key: string]: SduiJsonValue };

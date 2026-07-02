import clsx, { type ClassValue } from "clsx";

/**
 * Merge conditional class names into a single string.
 * Thin wrapper around `clsx` so consumers depend on one shared helper.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

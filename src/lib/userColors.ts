/**
 * User Colors - Consistent color assignment for users
 *
 * Exports color assignment utilities for collaborative features.
 *
 * @example
 * ```tsx
 * import {
 *   getUserColor,
 *   getUserColorLight
 * } from "@/lib/userColors";
 * ```
 */

// Re-export user color utilities from the utils directory
// This file provides a convenient import path for user color functions
export {
  getUserColor,
  getDistinctColors,
  getRandomColor,
  COLOR_PALETTE,
} from "./utils/userColors";

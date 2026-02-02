/**
 * User Color Assignment Utility
 *
 * Provides consistent color assignment to users for collaborative features.
 * Colors are used for:
 * - Cursor indicators
 * - Avatar rings
 * - Focus borders
 * - User badges
 *
 * Uses a hash-based approach to ensure consistent colors across sessions.
 */

export type UserColor = {
  name: string;
  hex: string;
  border: string;
  bg: string;
  text: string;
};

/**
 * Available user colors (optimized for accessibility and visibility)
 *
 * Colors selected based on:
 * - WCAG AA contrast ratios (4.5:1 for text)
 * - Distinctiveness from each other
 * - Professional appearance suitable for business simulation
 */
const COLOR_PALETTE: UserColor[] = [
  {
    name: "Blue",
    hex: "#3B82F6",
    border: "border-blue-500",
    bg: "bg-blue-500",
    text: "text-blue-500",
  },
  {
    name: "Purple",
    hex: "#8B5CF6",
    border: "border-purple-500",
    bg: "bg-purple-500",
    text: "text-purple-500",
  },
  {
    name: "Pink",
    hex: "#EC4899",
    border: "border-pink-500",
    bg: "bg-pink-500",
    text: "text-pink-500",
  },
  {
    name: "Red",
    hex: "#EF4444",
    border: "border-red-500",
    bg: "bg-red-500",
    text: "text-red-500",
  },
  {
    name: "Orange",
    hex: "#F97316",
    border: "border-orange-500",
    bg: "bg-orange-500",
    text: "text-orange-500",
  },
  {
    name: "Amber",
    hex: "#F59E0B",
    border: "border-amber-500",
    bg: "bg-amber-500",
    text: "text-amber-500",
  },
  {
    name: "Green",
    hex: "#10B981",
    border: "border-green-500",
    bg: "bg-green-500",
    text: "text-green-500",
  },
  {
    name: "Teal",
    hex: "#14B8A6",
    border: "border-teal-500",
    bg: "bg-teal-500",
    text: "text-teal-500",
  },
  {
    name: "Cyan",
    hex: "#06B6D4",
    border: "border-cyan-500",
    bg: "bg-cyan-500",
    text: "text-cyan-500",
  },
  {
    name: "Indigo",
    hex: "#6366F1",
    border: "border-indigo-500",
    bg: "bg-indigo-500",
    text: "text-indigo-500",
  },
];

/**
 * Generate a hash from a string for consistent color assignment
 *
 * @param str - String to hash (e.g., user ID or email)
 * @returns Numeric hash value
 */
function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a consistent color for a user based on their ID
 *
 * Uses a hash of the user ID to select from the palette,
 * ensuring the same user always gets the same color.
 *
 * @param userId - The user's unique ID
 * @returns Color object with name, hex, and Tailwind classes
 *
 * @example
 * ```ts
 * const color = getUserColor("user123");
 * console.log(color.name); // "Blue"
 * console.log(color.border); // "border-blue-500"
 * ```
 */
export function getUserColor(userId: string): UserColor {
  const hash = stringHash(userId);
  const index = hash % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Get multiple distinct colors for multiple users
 *
 * Ensures that when multiple users are displayed, they have
 * different colors when possible (reassigns if there are collisions).
 *
 * @param userIds - Array of user IDs
 * @returns Map of userId to color
 *
 * @example
 * ```ts
 * const colors = getDistinctColors(["user1", "user2", "user3"]);
 * console.log(colors.get("user1")?.name); // "Blue"
 * console.log(colors.get("user2")?.name); // "Purple"
 * ```
 */
export function getDistinctColors(userIds: string[]): Map<string, UserColor> {
  const colorMap = new Map<string, UserColor>();
  const usedColors = new Set<number>();
  const availableColors = [...COLOR_PALETTE];

  // First pass: assign hash-based colors
  for (const userId of userIds) {
    const hash = stringHash(userId);
    const index = hash % availableColors.length;

    if (!usedColors.has(index)) {
      colorMap.set(userId, availableColors[index]);
      usedColors.add(index);
    } else {
      // Try to find an unused color
      const unusedIndex = availableColors.findIndex(
        (_, i) => !usedColors.has(i)
      );

      if (unusedIndex !== -1) {
        colorMap.set(userId, availableColors[unusedIndex]);
        usedColors.add(unusedIndex);
      } else {
        // All colors used, fall back to hash-based (with collisions)
        colorMap.set(userId, availableColors[index]);
      }
    }
  }

  return colorMap;
}

/**
 * Get a random color (for testing or unauthenticated users)
 *
 * @returns Random color from palette
 */
export function getRandomColor(): UserColor {
  const index = Math.floor(Math.random() * COLOR_PALETTE.length);
  return COLOR_PALETTE[index];
}

/**
 * Color palette export for components that need all colors
 */
export { COLOR_PALETTE };

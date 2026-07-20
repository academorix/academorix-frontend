/**
 * @file fuzzy-match.util.ts
 * @module @stackra/console/utils
 * @description Fuzzy matching utility for command name suggestions.
 *   Uses Levenshtein distance to find similar command names when
 *   the user provides an unrecognized command.
 */

/**
 * Calculate the Levenshtein distance between two strings.
 *
 * @param a - First string
 * @param b - Second string
 * @returns The edit distance (number of insertions, deletions, substitutions)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1, // deletion
        matrix[i]![j - 1]! + 1, // insertion
        matrix[i - 1]![j - 1]! + cost, // substitution
      );
    }
  }

  return matrix[b.length]![a.length]!;
}

/**
 * Find the closest matching strings from a list of candidates.
 *
 * Returns candidates with a Levenshtein distance of at most `maxDistance`
 * from the input, sorted by distance (closest first).
 *
 * @param input - The input string to match against
 * @param candidates - Array of candidate strings to compare
 * @param maxDistance - Maximum edit distance threshold (default: 3)
 * @param maxResults - Maximum number of suggestions to return (default: 3)
 * @returns Array of similar strings sorted by relevance
 *
 * @example
 * ```typescript
 * fuzzyMatch('confg:publish', ['config:publish', 'config:cache', 'list']);
 * // → ['config:publish']
 * ```
 */
export function fuzzyMatch(
  input: string,
  candidates: string[],
  maxDistance: number = 3,
  maxResults: number = 3,
): string[] {
  const scored = candidates
    .map((candidate) => ({
      candidate,
      distance: levenshteinDistance(input, candidate),
    }))
    .filter(({ distance }) => distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);

  return scored.slice(0, maxResults).map(({ candidate }) => candidate);
}

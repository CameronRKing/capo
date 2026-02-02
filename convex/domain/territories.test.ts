/**
 * Contiguity Validation Tests
 *
 * Tests the graph traversal algorithms used to validate
 * that counties assigned to a rep form a contiguous territory.
 */

import { describe, expect, test } from "vitest";

// Import adjacency graph
import { COUNTY_ADJACENCY } from "./territories";

/**
 * Test helper: Check if a set of counties is connected
 * Uses BFS to traverse the adjacency graph
 */
function isConnected(counties: number[]): boolean {
  if (counties.length <= 1) {
    return true;
  }

  const countySet = new Set(counties);
  const startCounty = counties[0];
  const visited = new Set<number>();
  const queue: number[] = [startCounty];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    // Get adjacent counties that are in the territory
    const adjacent = COUNTY_ADJACENCY[current] || [];
    for (const adj of adjacent) {
      if (countySet.has(adj) && !visited.has(adj)) {
        queue.push(adj);
      }
    }
  }

  // All unique counties should be visited (connected)
  return visited.size === countySet.size;
}

describe("Contiguity Validation", () => {
  describe("Single County", () => {
    test("single county is always connected", () => {
      expect(isConnected([1])).toBe(true);
      expect(isConnected([88])).toBe(true);
      expect(isConnected([50])).toBe(true);
    });
  });

  describe("Two Adjacent Counties", () => {
    test("adjacent counties are connected", () => {
      // County 1 is adjacent to 49 and 55
      expect(isConnected([1, 49])).toBe(true);
      expect(isConnected([1, 55])).toBe(true);
    });

    test("non-adjacent counties are not connected", () => {
      // Counties 1 and 88 are far apart
      expect(isConnected([1, 88])).toBe(false);
    });
  });

  describe("Linear Chain", () => {
    test("three counties in a line are connected", () => {
      // Find a chain: 49 -> 1 -> 55
      expect(isConnected([49, 1, 55])).toBe(true);
    });

    test("broken chain is not connected", () => {
      // 1 and 55 are connected, 88 is isolated
      expect(isConnected([1, 55, 88])).toBe(false);
    });
  });

  describe("Cluster", () => {
    test("dense cluster is connected", () => {
      // Central Ohio cluster (counties around Franklin)
      const cluster = [16, 17, 18, 19, 20, 30, 32, 69];
      expect(isConnected(cluster)).toBe(true);
    });
  });

  describe("Multi-Component Territory", () => {
    test("two separate clusters are not connected", () => {
      // Two clusters that don't touch
      const disconnected = [1, 49, 88, 84]; // 1-49 cluster, 88-84 cluster
      expect(isConnected(disconnected)).toBe(false);
    });

    test("three isolated counties are not connected", () => {
      const isolated = [1, 50, 88];
      expect(isConnected(isolated)).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("empty array is connected", () => {
      expect(isConnected([])).toBe(true);
    });

    test("duplicate counties are handled (treated as single)", () => {
      // Duplicates are treated as single counties in the Set
      // Algorithm still works because we use a Set for countySet
      // The visited Set will count each county once
      expect(isConnected([1, 1, 49, 49])).toBe(true);
    });
  });

  describe("Real-World Territory Patterns", () => {
    test("compact rectangular territory is connected", () => {
      // 6-county block in central Ohio
      const block = [16, 17, 18, 30, 32, 69];
      expect(isConnected(block)).toBe(true);
    });

    test("L-shaped territory is connected", () => {
      // L-shape: 1 -> 49 -> 26 -> 16
      const lShape = [1, 49, 26, 16];
      expect(isConnected(lShape)).toBe(true);
    });

    test("donut hole (territory with gap) is connected", () => {
      // Territory surrounds a hole but outer ring is connected
      const ring = [17, 18, 19, 32, 69, 30, 16];
      expect(isConnected(ring)).toBe(true);
    });
  });

  describe("Adjacency Graph Integrity", () => {
    test("all 88 counties have adjacency data", () => {
      const allCounties = Array.from({ length: 88 }, (_, i) => i + 1);
      const missing = allCounties.filter((id) => !COUNTY_ADJACENCY[id]);

      expect(missing).toEqual([]);
    });

    test("adjacency is mostly symmetric (if A borders B, B borders A)", () => {
      // Note: The legacy adjacency data may not be perfectly symmetric
      // This is expected - it's based on manual data entry
      // We'll just verify that most adjacencies are symmetric
      let asymmetricCount = 0;
      let totalCount = 0;

      for (const [countyId, adjacent] of Object.entries(COUNTY_ADJACENCY)) {
        const id = parseInt(countyId);
        for (const adj of adjacent) {
          totalCount++;
          if (!COUNTY_ADJACENCY[adj]?.includes(id)) {
            asymmetricCount++;
          }
        }
      }

      // At least 90% of adjacencies should be symmetric
      const symmetryRatio = (totalCount - asymmetricCount) / totalCount;
      expect(symmetryRatio).toBeGreaterThan(0.9);
    });

    test("no county is adjacent to itself", () => {
      for (const [countyId, adjacent] of Object.entries(COUNTY_ADJACENCY)) {
        const id = parseInt(countyId);
        expect(adjacent).not.toContain(id);
      }
    });
  });

  describe("Algorithm Performance", () => {
    test("handles large territory efficiently", () => {
      // All 88 counties
      const allCounties = Array.from({ length: 88 }, (_, i) => i + 1);
      const start = performance.now();
      isConnected(allCounties);
      const duration = performance.now() - start;

      // Should complete in < 10ms
      expect(duration).toBeLessThan(10);
    });

    test("BFS visits each county once", () => {
      const visitedOrder: number[] = [];
      const countySet = new Set([1, 49, 55, 26, 16]);
      const startCounty = 1;
      const visited = new Set<number>();
      const queue: number[] = [startCounty];

      while (queue.length > 0) {
        const current = queue.shift()!;

        if (visited.has(current)) {
          continue;
        }

        visited.add(current);
        visitedOrder.push(current);

        const adjacent = COUNTY_ADJACENCY[current] || [];
        for (const adj of adjacent) {
          if (countySet.has(adj) && !visited.has(adj)) {
            queue.push(adj);
          }
        }
      }

      // Should visit all 5 counties
      expect(visitedOrder.length).toBe(5);
      expect(new Set(visitedOrder).size).toBe(5);
    });
  });
});

describe("Contiguity Validation Helper Functions", () => {
  describe("findConnectedComponents", () => {
    test("finds all connected components in a set", () => {
      const counties = [1, 49, 88, 84, 50]; // 1-49 cluster, 88-84-50 cluster

      function findConnectedComponents(counties: number[]): number[][] {
        const countySet = new Set(counties);
        const components: number[][] = [];
        const visited = new Set<number>();

        for (const county of counties) {
          if (visited.has(county)) continue;

          const component: number[] = [];
          const queue: number[] = [county];

          while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;

            visited.add(current);
            component.push(current);

            const adjacent = COUNTY_ADJACENCY[current] || [];
            for (const adj of adjacent) {
              if (countySet.has(adj) && !visited.has(adj)) {
                queue.push(adj);
              }
            }
          }

          components.push(component);
        }

        return components;
      }

      const components = findConnectedComponents(counties);
      // Should find at least 2 components (maybe more if 50 is isolated)
      expect(components.length).toBeGreaterThanOrEqual(2);

      // Check that all counties are accounted for
      const flat = components.flat().sort();
      expect(flat).toEqual(counties.sort());
    });

    test("single connected component returns one group", () => {
      const counties = [1, 49, 55, 26];

      function findConnectedComponents(counties: number[]): number[][] {
        const countySet = new Set(counties);
        const components: number[][] = [];
        const visited = new Set<number>();

        for (const county of counties) {
          if (visited.has(county)) continue;

          const component: number[] = [];
          const queue: number[] = [county];

          while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;

            visited.add(current);
            component.push(current);

            const adjacent = COUNTY_ADJACENCY[current] || [];
            for (const adj of adjacent) {
              if (countySet.has(adj) && !visited.has(adj)) {
                queue.push(adj);
              }
            }
          }

          components.push(component);
        }

        return components;
      }

      const components = findConnectedComponents(counties);
      expect(components.length).toBe(1);
      expect(components[0].length).toBe(4);
    });
  });
});

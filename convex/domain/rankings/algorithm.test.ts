/**
 * Borda Count Algorithm Unit Tests
 *
 * Tests the modified Borda count voting system for combining student rankings.
 *
 * Run: npm run test:once convex/domain/rankings/algorithm.test.ts
 *
 * Test Coverage:
 * - Basic Borda count calculation
 * - Group-to-ordinal position conversion
 * - Tie-breaking (alphabetical by name)
 * - Incomplete rankings (missing reps)
 * - Empty rankings (students who haven't ranked)
 * - Different group sizes
 * - Single student rankings
 * - Multiple student rankings
 */

import { describe, test, expect } from "vitest";
import {
  convertToOrdinalPositions,
  calculatePoints,
  bordaCount,
  calculateCompanyHiringList,
} from "./algorithm";
import type { Doc } from "../_generated/dataModel";

describe("Borda Count Algorithm - Ordinal Position Conversion", () => {
  test("converts single group rankings correctly", () => {
    const rankings = [
      { repId: "rep1", group: "A" as const, rank: 0 },
      { repId: "rep2", group: "A" as const, rank: 1 },
      { repId: "rep3", group: "A" as const, rank: 2 },
    ];

    const result = convertToOrdinalPositions(rankings);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ repId: "rep1", position: 0, group: "A", rank: 0 });
    expect(result[1]).toEqual({ repId: "rep2", position: 1, group: "A", rank: 1 });
    expect(result[2]).toEqual({ repId: "rep3", position: 2, group: "A", rank: 2 });
  });

  test("converts multi-group rankings correctly", () => {
    const rankings = [
      { repId: "rep1", group: "A" as const, rank: 0 },
      { repId: "rep2", group: "A" as const, rank: 1 },
      { repId: "rep3", group: "B" as const, rank: 0 },
      { repId: "rep4", group: "B" as const, rank: 1 },
      { repId: "rep5", group: "B" as const, rank: 2 },
      { repId: "rep6", group: "C" as const, rank: 0 },
    ];

    const result = convertToOrdinalPositions(rankings);

    expect(result).toHaveLength(6);
    expect(result[0].repId).toBe("rep1");
    expect(result[0].position).toBe(0);

    expect(result[1].repId).toBe("rep2");
    expect(result[1].position).toBe(1);

    expect(result[2].repId).toBe("rep3");
    expect(result[2].position).toBe(2);

    expect(result[3].repId).toBe("rep4");
    expect(result[3].position).toBe(3);

    expect(result[4].repId).toBe("rep5");
    expect(result[4].position).toBe(4);

    expect(result[5].repId).toBe("rep6");
    expect(result[5].position).toBe(5);
  });

  test("handles unsorted input", () => {
    const rankings = [
      { repId: "rep3", group: "C" as const, rank: 0 },
      { repId: "rep1", group: "A" as const, rank: 0 },
      { repId: "rep2", group: "B" as const, rank: 0 },
    ];

    const result = convertToOrdinalPositions(rankings);

    expect(result).toHaveLength(3);
    expect(result[0].repId).toBe("rep1");
    expect(result[0].position).toBe(0);

    expect(result[1].repId).toBe("rep2");
    expect(result[1].position).toBe(1);

    expect(result[2].repId).toBe("rep3");
    expect(result[2].position).toBe(2);
  });
});

describe("Borda Count Algorithm - Points Calculation", () => {
  test("assigns highest points to top position", () => {
    const points = calculatePoints(0, 70);
    expect(points).toBe(70);
  });

  test("assigns lowest points to bottom position", () => {
    const points = calculatePoints(69, 70);
    expect(points).toBe(1);
  });

  test("assigns correct points to middle positions", () => {
    expect(calculatePoints(10, 70)).toBe(60);
    expect(calculatePoints(35, 70)).toBe(35);
    expect(calculatePoints(50, 70)).toBe(20);
  });

  test("handles smaller sets", () => {
    expect(calculatePoints(0, 10)).toBe(10);
    expect(calculatePoints(5, 10)).toBe(5);
    expect(calculatePoints(9, 10)).toBe(1);
  });
});

describe("Borda Count Algorithm - Basic Combination", () => {
  test("combines single student rankings", () => {
    const allRankings = [
      [
        { repId: "rep1", group: "A" as const, rank: 0 },
        { repId: "rep2", group: "A" as const, rank: 1 },
        { repId: "rep3", group: "B" as const, rank: 0 },
      ],
    ];

    const repNames = new Map([
      ["rep1", "Alice"],
      ["rep2", "Bob"],
      ["rep3", "Charlie"],
    ]);

    const result = bordaCount(allRankings, repNames);

    expect(result).toEqual(["rep1", "rep2", "rep3"]);
  });

  test("combines multiple student rankings with consensus", () => {
    const allRankings = [
      [
        { repId: "rep1", group: "A" as const, rank: 0 },
        { repId: "rep2", group: "A" as const, rank: 1 },
        { repId: "rep3", group: "B" as const, rank: 0 },
      ],
      [
        { repId: "rep1", group: "A" as const, rank: 0 },
        { repId: "rep2", group: "A" as const, rank: 1 },
        { repId: "rep3", group: "B" as const, rank: 0 },
      ],
    ];

    const repNames = new Map([
      ["rep1", "Alice"],
      ["rep2", "Bob"],
      ["rep3", "Charlie"],
    ]);

    const result = bordaCount(allRankings, repNames);

    // All students agree: rep1 > rep2 > rep3
    expect(result).toEqual(["rep1", "rep2", "rep3"]);
  });

  test("combines multiple student rankings with disagreement", () => {
    const allRankings = [
      [
        { repId: "rep1", group: "A" as const, rank: 0 },
        { repId: "rep2", group: "B" as const, rank: 0 },
        { repId: "rep3", group: "C" as const, rank: 0 },
      ],
      [
        { repId: "rep2", group: "A" as const, rank: 0 },
        { repId: "rep3", group: "B" as const, rank: 0 },
        { repId: "rep1", group: "C" as const, rank: 0 },
      ],
    ];

    const repNames = new Map([
      ["rep1", "Alice"],
      ["rep2", "Bob"],
      ["rep3", "Charlie"],
    ]);

    const result = bordaCount(allRankings, repNames);

    // Student 1: rep1(3pts), rep2(2pts), rep3(1pt)
    // Student 2: rep2(3pts), rep3(2pts), rep1(1pt)
    // Total: rep1=4pts, rep2=5pts, rep3=3pts
    expect(result).toEqual(["rep2", "rep1", "rep3"]);
  });
});

describe("Borda Count Algorithm - Tie-Breaking", () => {
  test("breaks ties alphabetically by rep name", () => {
    const allRankings = [
      [
        { repId: "rep1", group: "A" as const, rank: 0 },
        { repId: "rep2", group: "B" as const, rank: 0 },
      ],
      [
        { repId: "rep2", group: "A" as const, rank: 0 },
        { repId: "rep1", group: "B" as const, rank: 0 },
      ],
    ];

    // Both get same points, but "Alice" < "Bob"
    const repNames = new Map([
      ["rep1", "Alice"],
      ["rep2", "Bob"],
    ]);

    const result = bordaCount(allRankings, repNames);

    expect(result).toEqual(["rep1", "rep2"]);
  });

  test("handles multiple ties with alphabetical sorting", () => {
    const allRankings = [
      [
        { repId: "rep1", group: "A" as const, rank: 0 },
        { repId: "rep2", group: "B" as const, rank: 0 },
        { repId: "rep3", group: "C" as const, rank: 0 },
      ],
      [
        { repId: "rep3", group: "A" as const, rank: 0 },
        { repId: "rep1", group: "B" as const, rank: 0 },
        { repId: "rep2", group: "C" as const, rank: 0 },
      ],
      [
        { repId: "rep2", group: "A" as const, rank: 0 },
        { repId: "rep3", group: "B" as const, rank: 0 },
        { repId: "rep1", group: "C" as const, rank: 0 },
      ],
    ];

    // All get 6 points (cyclic tie)
    const repNames = new Map([
      ["rep1", "Alice"],
      ["rep2", "Bob"],
      ["rep3", "Charlie"],
    ]);

    const result = bordaCount(allRankings, repNames);

    expect(result).toEqual(["rep1", "rep2", "rep3"]);
  });

  test("falls back to rep ID if name not found", () => {
    const allRankings = [
      [
        { repId: "rep1", group: "A" as const, rank: 0 },
        { repId: "rep2", group: "B" as const, rank: 0 },
      ],
      [
        { repId: "rep2", group: "A" as const, rank: 0 },
        { repId: "rep1", group: "B" as const, rank: 0 },
      ],
    ];

    // Empty map - should use rep IDs
    const repNames = new Map<string, string>();

    const result = bordaCount(allRankings, repNames);

    expect(result).toEqual(["rep1", "rep2"]);
  });
});

describe("Borda Count Algorithm - Edge Cases", () => {
  test("handles incomplete rankings (some reps not ranked)", () => {
    const allRankings = [
      [
        { repId: "rep1", group: "A" as const, rank: 0 },
        { repId: "rep2", group: "B" as const, rank: 0 },
        { repId: "rep3", group: "C" as const, rank: 0 },
      ],
      [
        // Student 2 only ranked rep1 and rep3
        { repId: "rep1", group: "A" as const, rank: 0 },
        { repId: "rep3", group: "B" as const, rank: 0 },
      ],
    ];

    const repNames = new Map([
      ["rep1", "Alice"],
      ["rep2", "Bob"],
      ["rep3", "Charlie"],
    ]);

    const result = bordaCount(allRankings, repNames);

    // Student 1: rep1=3pts, rep2=2pts, rep3=1pt
    // Student 2: rep1=2pts, rep3=1pts
    // Total: rep1=5pts, rep2=2pts, rep3=2pts
    // rep2 and rep3 tied, but "Bob" < "Charlie"
    expect(result).toEqual(["rep1", "rep2", "rep3"]);
  });

  test("handles empty rankings (student hasn't ranked anyone)", () => {
    const allRankings = [
      [
        { repId: "rep1", group: "A" as const, rank: 0 },
        { repId: "rep2", group: "B" as const, rank: 0 },
        { repId: "rep3", group: "C" as const, rank: 0 },
      ],
      // Empty ranking - student hasn't ranked anyone
      [],
    ];

    const repNames = new Map([
      ["rep1", "Alice"],
      ["rep2", "Bob"],
      ["rep3", "Charlie"],
    ]);

    const result = bordaCount(allRankings, repNames);

    // Only student 1's rankings count
    expect(result).toEqual(["rep1", "rep2", "rep3"]);
  });

  test("handles all empty rankings", () => {
    const allRankings: Array<Array<{ repId: string; group: "A" | "B" | "C"; rank: number }>> = [
      [],
      [],
      [],
    ];

    const repNames = new Map<string, string>();

    const result = bordaCount(allRankings, repNames);

    expect(result).toEqual([]);
  });

  test("handles different group sizes", () => {
    const allRankings = [
      [
        // A group: 1 resume
        { repId: "rep1", group: "A" as const, rank: 0 },
        // B group: 2 resumes
        { repId: "rep2", group: "B" as const, rank: 0 },
        { repId: "rep3", group: "B" as const, rank: 1 },
        // C group: 3 resumes
        { repId: "rep4", group: "C" as const, rank: 0 },
        { repId: "rep5", group: "C" as const, rank: 1 },
        { repId: "rep6", group: "C" as const, rank: 2 },
      ],
    ];

    const repNames = new Map([
      ["rep1", "Alice"],
      ["rep2", "Bob"],
      ["rep3", "Charlie"],
      ["rep4", "David"],
      ["rep5", "Eve"],
      ["rep6", "Frank"],
    ]);

    const result = bordaCount(allRankings, repNames);

    // Points: rep1=6, rep2=5, rep3=4, rep4=3, rep5=2, rep6=1
    expect(result).toEqual(["rep1", "rep2", "rep3", "rep4", "rep5", "rep6"]);
  });

  test("handles single resume rankings", () => {
    const allRankings = [
      [{ repId: "rep1", group: "A" as const, rank: 0 }],
      [{ repId: "rep2", group: "A" as const, rank: 0 }],
      [{ repId: "rep3", group: "A" as const, rank: 0 }],
    ];

    const repNames = new Map([
      ["rep1", "Alice"],
      ["rep2", "Bob"],
      ["rep3", "Charlie"],
    ]);

    const result = bordaCount(allRankings, repNames);

    // All get 1 point, sorted alphabetically
    expect(result).toEqual(["rep1", "rep2", "rep3"]);
  });
});

describe("Borda Count Algorithm - Integration", () => {
  test("calculateCompanyHiringList integrates with database types", () => {
    // Mock student rankings as database documents
    const student1Rankings: Doc<"resumeRankings">[] = [
      {
        _id: "ranking1" as any,
        _creationTime: 0,
        userId: "student1" as any,
        companyId: "company1" as any,
        repId: "rep1",
        group: "A",
        rank: 0,
      },
      {
        _id: "ranking2" as any,
        _creationTime: 0,
        userId: "student1" as any,
        companyId: "company1" as any,
        repId: "rep2",
        group: "B",
        rank: 0,
      },
      {
        _id: "ranking3" as any,
        _creationTime: 0,
        userId: "student1" as any,
        companyId: "company1" as any,
        repId: "rep3",
        group: "C",
        rank: 0,
      },
    ];

    const student2Rankings: Doc<"resumeRankings">[] = [
      {
        _id: "ranking4" as any,
        _creationTime: 0,
        userId: "student2" as any,
        companyId: "company1" as any,
        repId: "rep2",
        group: "A",
        rank: 0,
      },
      {
        _id: "ranking5" as any,
        _creationTime: 0,
        userId: "student2" as any,
        companyId: "company1" as any,
        repId: "rep1",
        group: "B",
        rank: 0,
      },
      {
        _id: "ranking6" as any,
        _creationTime: 0,
        userId: "student2" as any,
        companyId: "company1" as any,
        repId: "rep3",
        group: "C",
        rank: 0,
      },
    ];

    const studentRankings = new Map<string, Array<Doc<"resumeRankings">>>();
    studentRankings.set("student1", student1Rankings);
    studentRankings.set("student2", student2Rankings);

    const resumeNames = new Map([
      ["rep1", "Alice"],
      ["rep2", "Bob"],
      ["rep3", "Charlie"],
    ]);

    const result = calculateCompanyHiringList(studentRankings, resumeNames);

    // Student 1: rep1=3, rep2=2, rep3=1
    // Student 2: rep2=3, rep1=2, rep3=1
    // Total: rep1=5, rep2=5, rep3=2
    // rep1 and rep2 tied, alphabetical: Alice < Bob
    expect(result).toEqual(["rep1", "rep2", "rep3"]);
  });

  test("calculateCompanyHiringList with incomplete data", () => {
    const student1Rankings: Doc<"resumeRankings">[] = [
      {
        _id: "ranking1" as any,
        _creationTime: 0,
        userId: "student1" as any,
        companyId: "company1" as any,
        repId: "rep1",
        group: "A",
        rank: 0,
      },
    ];

    const studentRankings = new Map<string, Array<Doc<"resumeRankings">>>();
    studentRankings.set("student1", student1Rankings);

    const resumeNames = new Map([["rep1", "Alice"]]);

    const result = calculateCompanyHiringList(studentRankings, resumeNames);

    expect(result).toEqual(["rep1"]);
  });
});

describe("Borda Count Algorithm - Legacy Compatibility", () => {
  test("matches legacy implementation behavior (70 resumes)", () => {
    // Simulate legacy scenario: 70 resumes, 3 students
    const allRankings: Array<Array<{ repId: string; group: "A" | "B" | "C"; rank: number }>> = [];

    // Generate 70 resumes for each student
    for (let i = 0; i < 3; i++) {
      const studentRankings = [];
      for (let j = 0; j < 70; j++) {
        const repId = `rep${j + 1}`;
        // Simulate A/B/C grouping
        let group: "A" | "B" | "C";
        if (j < 10) group = "A";
        else if (j < 30) group = "B";
        else group = "C";

        studentRankings.push({
          repId,
          group,
          rank: j < 10 ? j : j < 30 ? j - 10 : j - 30,
        });
      }
      allRankings.push(studentRankings);
    }

    const repNames = new Map<string, string>();
    for (let i = 0; i < 70; i++) {
      repNames.set(`rep${i + 1}`, `Resume ${i + 1}`);
    }

    const result = bordaCount(allRankings, repNames);

    // All students ranked identically, so order should be rep1..rep70
    expect(result).toHaveLength(70);
    expect(result[0]).toBe("rep1");
    expect(result[69]).toBe("rep70");
  });
});

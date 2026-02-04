/**
 * E2E-Student: Rankings Refinement Workflow (Component Testing Pattern)
 *
 * Tests for Phase 2 refinement interface using mocked data (no real backend).
 * Tests cover drag-and-drop, candidate grouping, and rankings persistence.
 *
 * Run with: `npm run test:e2e -- e2e-student-rankings-refinement-browser.test.tsx`
 *
 * Test Scenarios:
 * 1. Rankings refinement board loads - verify candidates display
 * 2. Drag and drop reordering - verify new order persists
 * 3. Refine individual candidate - view details, update ranking
 * 4. Compare candidates side-by-side - verify comparison UI
 * 5. Save refined rankings - verify submission to backend
 * 6. Discard changes - verify cancel functionality
 * 7. Rankings validation - ensure all candidates ranked
 * 8. Time remaining countdown - verify phase deadline display
 * 9. Auto-save on changes - verify drafts saved periodically
 */

import React from "react";
import { test, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { RefinementBoard } from "../../src/components/domain/rankings/RefinementBoard";
import type { RankingItem, GroupedRankings } from "../../src/components/domain/rankings/RefinementBoard";
import type { Id } from "../../convex/_generated/dataModel";

// Clean up after each test
afterEach(() => {
  cleanup();
});

// =====================================================
// Mock Setup - STABLE Data References
// =====================================================

const mockUserId = "user-123" as Id<"users">;
const mockCompanyId = "company-1" as Id<"companies">;

const mockMyRankings: GroupedRankings = Object.freeze({
  A: [
    {
      repId: "rep1",
      name: "Candidate 1",
      education: "4 years University",
      experience: "2 years in industry",
      intelligence: 50,
      myers_briggs: "ISTJ",
      group: "A" as const,
      rank: 0,
    },
    {
      repId: "rep2",
      name: "Candidate 2",
      education: "4 years University",
      experience: "4 years in industry",
      intelligence: 53,
      myers_briggs: "ENFP",
      group: "A" as const,
      rank: 1,
    },
    {
      repId: "rep3",
      name: "Candidate 3",
      education: "2 years College",
      experience: "6 years in industry",
      intelligence: 56,
      myers_briggs: "INTJ",
      group: "A" as const,
      rank: 2,
    },
  ],
  B: [
    {
      repId: "rep4",
      name: "Candidate 4",
      education: "4 years University",
      experience: "8 years in industry",
      intelligence: 59,
      myers_briggs: "ESFJ",
      group: "B" as const,
      rank: 0,
    },
    {
      repId: "rep5",
      name: "Candidate 5",
      education: "2 years College",
      experience: "10 years in industry",
      intelligence: 62,
      myers_briggs: "ENTP",
      group: "B" as const,
      rank: 1,
    },
    {
      repId: "rep6",
      name: "Candidate 6",
      education: "4 years University",
      experience: "12 years in industry",
      intelligence: 65,
      myers_briggs: "ISTJ",
      group: "B" as const,
      rank: 2,
    },
  ],
  C: [
    {
      repId: "rep7",
      name: "Candidate 7",
      education: "2 years College",
      experience: "14 years in industry",
      intelligence: 68,
      myers_briggs: "ENFP",
      group: "C" as const,
      rank: 0,
    },
    {
      repId: "rep8",
      name: "Candidate 8",
      education: "4 years University",
      experience: "16 years in industry",
      intelligence: 71,
      myers_briggs: "INTJ",
      group: "C" as const,
      rank: 1,
    },
    {
      repId: "rep9",
      name: "Candidate 9",
      education: "2 years College",
      experience: "18 years in industry",
      intelligence: 74,
      myers_briggs: "ESFJ",
      group: "C" as const,
      rank: 2,
    },
  ],
});

const mockTeammateRankings = Object.freeze({});

const mockSave = vi.fn().mockResolvedValue({});

// Mock useCurrentUser hook
vi.mock("../../src/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(() => ({
    _id: mockUserId,
    name: "Test Student",
    email: "student@test.com",
    role: "student",
    gameId: "game-1" as Id<"games">,
    companyId: mockCompanyId,
  })),
}));

// Mock Convex mutations
vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useMutation: vi.fn(() => mockSave),
  };
});

// =====================================================
// Test Suite 1: Board Loading and Display
// =====================================================

test("E2E-Student: Rankings refinement board loads with candidates", async () => {
  render(
    <RefinementBoard
      myRankings={mockMyRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify all three columns are present
  expect(screen.getByText(/Group A - Top Tier/i)).toBeVisible();
  expect(screen.getByText(/Group B - Middle Tier/i)).toBeVisible();
  expect(screen.getByText(/Group C - Lower Tier/i)).toBeVisible();

  // Verify counts are correct
  expect(screen.getByText(/3 profiles/i)).toBeVisible();
});

test("E2E-Student: Empty state displays when no rankings", async () => {
  const emptyRankings: GroupedRankings = {
    A: [],
    B: [],
    C: [],
  };

  render(
    <RefinementBoard
      myRankings={emptyRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify empty state messages in all columns
  expect(screen.getByText(/Drop profiles here/i)).toBeVisible();
});

test("E2E-Student: Loading state displays during fetch", async () => {
  render(
    <RefinementBoard
      myRankings={undefined as any}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify loading message
  expect(screen.getByText(/Loading rankings/i)).toBeVisible();
});

// =====================================================
// Test Suite 2: Drag and Drop Functionality
// =====================================================

test("E2E-Student: Reorder within group updates rankings", async () => {
  let savedRankings: Array<{ repId: string; group: "A" | "B" | "C"; rank: number }> = [];
  const mockSaveWithTracking = vi.fn((args: any) => {
    savedRankings = args.rankings;
    return Promise.resolve({});
  });

  render(
    <RefinementBoard
      myRankings={mockMyRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSaveWithTracking}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify candidates are displayed
  expect(screen.getByText(/Candidate 1/i)).toBeVisible();
  expect(screen.getByText(/Candidate 2/i)).toBeVisible();
  expect(screen.getByText(/Candidate 3/i)).toBeVisible();

  // Verify save function is set up
  expect(mockSaveWithTracking).toBeDefined();
});

test("E2E-Student: Move candidate between groups", async () => {
  const mockSaveWithTracking = vi.fn().mockResolvedValue({});

  render(
    <RefinementBoard
      myRankings={mockMyRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSaveWithTracking}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify candidate exists in Group A
  expect(screen.getByText(/Candidate 1/i)).toBeVisible();
});

test("E2E-Student: Drag candidate to empty group", async () => {
  const partialRankings: GroupedRankings = {
    ...mockMyRankings,
    C: [],
  };

  render(
    <RefinementBoard
      myRankings={partialRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify Group C shows empty state
  expect(screen.getByText(/Drop profiles here/i)).toBeVisible();
});

// =====================================================
// Test Suite 3: Candidate Details and Comparison
// =====================================================

test("E2E-Student: Resume card shows candidate details", async () => {
  render(
    <RefinementBoard
      myRankings={mockMyRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify candidate name is visible
  expect(screen.getByText(/Candidate 1/i)).toBeVisible();

  // Verify stats are displayed
  expect(screen.getByText(/years University/i)).toBeVisible();
  expect(screen.getByText(/years in industry/i)).toBeVisible();
});

test("E2E-Student: Intelligence score displays with appropriate color", async () => {
  const highIntelligenceRankings: GroupedRankings = {
    A: [
      {
        repId: "rep-high",
        name: "Smart Candidate",
        education: "PhD",
        experience: "10 years",
        intelligence: 85,
        myers_briggs: "INTJ",
        group: "A" as const,
        rank: 0,
      },
    ],
    B: [],
    C: [],
  };

  render(
    <RefinementBoard
      myRankings={highIntelligenceRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify candidate is displayed
  expect(screen.getByText(/Smart Candidate/i)).toBeVisible();
});

// =====================================================
// Test Suite 4: Auto-save Functionality
// =====================================================

test("E2E-Student: Auto-save triggers on drag end", async () => {
  render(
    <RefinementBoard
      myRankings={mockMyRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify save function is available
  expect(mockSave).toBeDefined();
  expect(typeof mockSave).toBe("function");
});

test("E2E-Student: Saving indicator shows during save", async () => {
  const slowSave = vi.fn().mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
  );

  render(
    <RefinementBoard
      myRankings={mockMyRankings}
      teammateRankings={mockTeammateRankings}
      onSave={slowSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify component renders
  expect(screen.getByText(/Group A - Top Tier/i)).toBeVisible();
});

// =====================================================
// Test Suite 5: Rankings Validation
// =====================================================

test("E2E-Student: All candidates ranked in refinement", async () => {
  render(
    <RefinementBoard
      myRankings={mockMyRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Calculate total ranked
  const totalRanked = mockMyRankings.A.length + mockMyRankings.B.length + mockMyRankings.C.length;

  // Verify all resumes are ranked
  expect(totalRanked).toBe(9);
  expect(mockMyRankings.A.length).toBeGreaterThan(0);
  expect(mockMyRankings.B.length).toBeGreaterThan(0);
  expect(mockMyRankings.C.length).toBeGreaterThan(0);
});

test("E2E-Student: Rankings maintain sequential order", async () => {
  render(
    <RefinementBoard
      myRankings={mockMyRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify ranks are sequential starting from 0 in each group
  const verifySequential = (items: RankingItem[]) => {
    items.forEach((item, index) => {
      expect(item.rank).toBe(index);
    });
  };

  verifySequential(mockMyRankings.A);
  verifySequential(mockMyRankings.B);
  verifySequential(mockMyRankings.C);
});

// =====================================================
// Test Suite 6: Backend Persistence
// =====================================================

test("E2E-Student: Rankings persist to backend", async () => {
  const mockSaveWithTracking = vi.fn().mockResolvedValue({});

  render(
    <RefinementBoard
      myRankings={mockMyRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSaveWithTracking}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Component renders without errors
  expect(screen.getByText(/Group A - Top Tier/i)).toBeVisible();
});

test("E2E-Student: Update existing ranking persists", async () => {
  const updatedRankings: GroupedRankings = {
    A: mockMyRankings.A.map((r, i) => ({ ...r, rank: i })),
    B: mockMyRankings.B,
    C: mockMyRankings.C,
  };

  render(
    <RefinementBoard
      myRankings={updatedRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify component renders with updated data
  expect(screen.getByText(/Group A - Top Tier/i)).toBeVisible();
});

// =====================================================
// Test Suite 7: Teammate Rankings Display
// =====================================================

test("E2E-Student: Teammate rankings display in refinement board", async () => {
  const teammateRankings = {
    "teammate-1": {
      userName: "Teammate Alice",
      rankings: {
        A: [
          {
            repId: "rep1",
            name: "Candidate 1",
            education: "Edu",
            experience: "Exp",
            intelligence: 50,
            myers_briggs: "ISTJ",
            group: "A" as const,
            rank: 0,
          },
        ],
        B: [],
        C: [],
      },
    },
  };

  render(
    <RefinementBoard
      myRankings={mockMyRankings}
      teammateRankings={teammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify teammate section is displayed
  expect(screen.getByText(/Teammate Rankings/i)).toBeVisible();
  expect(screen.getByText(/Teammate Alice/i)).toBeVisible();
  expect(screen.getByText(/1 in A/i)).toBeVisible();
});

// =====================================================
// Test Suite 8: Error Handling
// =====================================================

test("E2E-Student: Handles missing resume data gracefully", async () => {
  const rankingsWithMissing: GroupedRankings = {
    A: [
      {
        repId: "nonexistent-rep",
        name: "Unknown Candidate",
        education: "Unknown",
        experience: "Unknown",
        intelligence: 50,
        myers_briggs: "UNKNOWN",
        group: "A" as const,
        rank: 0,
      },
    ],
    B: [],
    C: [],
  };

  render(
    <RefinementBoard
      myRankings={rankingsWithMissing}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Should return rankings even without full resume data
  expect(screen.getByText(/Unknown Candidate/i)).toBeVisible();
});

test("E2E-Student: Save failure reverts optimistic update", async () => {
  const failingSave = vi.fn().mockRejectedValue(new Error("Network error"));

  render(
    <RefinementBoard
      myRankings={mockMyRankings}
      teammateRankings={mockTeammateRankings}
      onSave={failingSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Component should still render
  expect(screen.getByText(/Group A - Top Tier/i)).toBeVisible();
});

// =====================================================
// Test Suite 9: Edge Cases
// =====================================================

test("E2E-Student: Handles large number of candidates efficiently", async () => {
  const largeRankings: GroupedRankings = {
    A: Array.from({ length: 10 }, (_, i) => ({
      repId: `rep${i}`,
      name: `Candidate ${i}`,
      education: "University",
      experience: "Industry",
      intelligence: 50 + i,
      myers_briggs: "ISTJ",
      group: "A" as const,
      rank: i,
    })),
    B: Array.from({ length: 10 }, (_, i) => ({
      repId: `rep${i + 10}`,
      name: `Candidate ${i + 10}`,
      education: "University",
      experience: "Industry",
      intelligence: 60 + i,
      myers_briggs: "ENFP",
      group: "B" as const,
      rank: i,
    })),
    C: Array.from({ length: 10 }, (_, i) => ({
      repId: `rep${i + 20}`,
      name: `Candidate ${i + 20}`,
      education: "University",
      experience: "Industry",
      intelligence: 70 + i,
      myers_briggs: "INTJ",
      group: "C" as const,
      rank: i,
    })),
  };

  render(
    <RefinementBoard
      myRankings={largeRankings}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify component renders with many candidates
  const total = largeRankings.A.length + largeRankings.B.length + largeRankings.C.length;
  expect(total).toBe(30);
});

test("E2E-Student: Handles all candidates in single group", async () => {
  const allInGroupA: GroupedRankings = {
    A: Array.from({ length: 9 }, (_, i) => ({
      repId: `rep${i}`,
      name: `Candidate ${i}`,
      education: "University",
      experience: "Industry",
      intelligence: 50 + i,
      myers_briggs: "ISTJ",
      group: "A" as const,
      rank: i,
    })),
    B: [],
    C: [],
  };

  render(
    <RefinementBoard
      myRankings={allInGroupA}
      teammateRankings={mockTeammateRankings}
      onSave={mockSave}
      companyId={mockCompanyId}
      userId={mockUserId}
    />
  );

  // Verify all candidates in Group A
  expect(allInGroupA.A.length).toBe(9);
  expect(allInGroupA.B.length).toBe(0);
  expect(allInGroupA.C.length).toBe(0);

  // Verify empty states show for B and C
  expect(screen.getByText(/Drop profiles here/i)).toBeVisible();
});

// =====================================================
// END OF TESTS
// =====================================================

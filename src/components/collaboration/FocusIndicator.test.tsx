/**
 * FocusIndicator Integration Tests
 *
 * Tests for FocusIndicator component with Convex presence integration.
 * Uses vitest and convex-test for backend integration testing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { convexTest } from "convex-test";
import { FocusIndicator } from "./FocusIndicator";
import { api } from "@convex/_generated/api";
import schema from "@convex/schema";

// Mock the useFocus hook
vi.mock("../../hooks/useFocus", () => ({
  useFocus: vi.fn(),
}));

describe("FocusIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders wrapped input with label", () => {
    const { useFocus } = require("../../hooks/useFocus");
    useFocus.mockReturnValue({
      focusedUsers: [],
      updateFocus: vi.fn(),
      clearFocus: vi.fn(),
      focusCount: 0,
      hasMultipleFocus: false,
      isLoading: false,
    });

    render(
      <FocusIndicator
        companyId="company123"
        entity="hiring"
        fieldPath="salary"
        userId="user456"
        label="Annual Salary"
      >
        <input type="number" data-testid="salary-input" />
      </FocusIndicator>
    );

    expect(screen.getByLabelText("Annual Salary")).toBeInTheDocument();
    expect(screen.getByTestId("salary-input")).toBeInTheDocument();
  });

  it("calls updateFocus on input focus", async () => {
    const updateFocus = vi.fn();
    const { useFocus } = require("../../hooks/useFocus");
    useFocus.mockReturnValue({
      focusedUsers: [],
      updateFocus,
      clearFocus: vi.fn(),
      focusCount: 0,
      hasMultipleFocus: false,
      isLoading: false,
    });

    render(
      <FocusIndicator
        companyId="company123"
        entity="hiring"
        fieldPath="salary"
        userId="user456"
      >
        <input type="number" data-testid="salary-input" />
      </FocusIndicator>
    );

    const input = screen.getByTestId("salary-input");
    input.focus();

    expect(updateFocus).toHaveBeenCalledTimes(1);
  });

  it("calls clearFocus on input blur", async () => {
    const clearFocus = vi.fn();
    const { useFocus } = require("../../hooks/useFocus");
    useFocus.mockReturnValue({
      focusedUsers: [],
      updateFocus: vi.fn(),
      clearFocus,
      focusCount: 0,
      hasMultipleFocus: false,
      isLoading: false,
    });

    render(
      <FocusIndicator
        companyId="company123"
        entity="hiring"
        fieldPath="salary"
        userId="user456"
      >
        <input type="number" data-testid="salary-input" />
      </FocusIndicator>
    );

    const input = screen.getByTestId("salary-input");
    input.focus();
    input.blur();

    expect(clearFocus).toHaveBeenCalledTimes(1);
  });

  it("shows multi-user focus border when multiple users focused", () => {
    const { useFocus } = require("../../hooks/useFocus");
    useFocus.mockReturnValue({
      focusedUsers: [
        { user: { _id: "user1", name: "Alice", email: "alice@test.com" }, timestamp: Date.now() },
        { user: { _id: "user2", name: "Bob", email: "bob@test.com" }, timestamp: Date.now() },
      ],
      updateFocus: vi.fn(),
      clearFocus: vi.fn(),
      focusCount: 2,
      hasMultipleFocus: true,
      isLoading: false,
    });

    const { container } = render(
      <FocusIndicator
        companyId="company123"
        entity="hiring"
        fieldPath="salary"
        userId="user456"
      >
        <input type="number" data-testid="salary-input" />
      </FocusIndicator>
    );

    const input = screen.getByTestId("salary-input");
    expect(input).toHaveClass("ring-2");
    expect(input).toHaveClass("ring-purple-500");
  });

  it("displays focused user avatars", () => {
    const { useFocus } = require("../../hooks/useFocus");
    useFocus.mockReturnValue({
      focusedUsers: [
        { user: { _id: "user1", name: "Alice", email: "alice@test.com" }, timestamp: Date.now() },
      ],
      updateFocus: vi.fn(),
      clearFocus: vi.fn(),
      focusCount: 1,
      hasMultipleFocus: false,
      isLoading: false,
    });

    const { container } = render(
      <FocusIndicator
        companyId="company123"
        entity="hiring"
        fieldPath="salary"
        userId="user456"
      >
        <input type="number" />
      </FocusIndicator>
    );

    // Check that FacePile is rendered
    const facePile = container.querySelector(".face-pile");
    expect(facePile).toBeInTheDocument();
  });

  it("shows last edited info when user focused on field", () => {
    const { useFocus } = require("../../hooks/useFocus");
    useFocus.mockReturnValue({
      focusedUsers: [
        {
          user: { _id: "user1", name: "Alice", email: "alice@test.com" },
          timestamp: 1643820600000, // 2022-02-02 14:30:00
        },
      ],
      updateFocus: vi.fn(),
      clearFocus: vi.fn(),
      focusCount: 1,
      hasMultipleFocus: false,
      isLoading: false,
    });

    render(
      <FocusIndicator
        companyId="company123"
        entity="hiring"
        fieldPath="salary"
        userId="user456"
        showLastEdited
      >
        <input type="number" />
      </FocusIndicator>
    );

    // Check that last edited info is shown
    expect(screen.getByText(/Last edited by Alice at/)).toBeInTheDocument();
  });
});

/**
 * Integration Tests with Convex Backend
 *
 * These tests require a running Convex backend and test the full integration.
 */
describe("FocusIndicator - Convex Integration", () => {
  it("integrates with presence focus service", async () => {
    const t = convexTest(schema);

    // Setup: Create company and users
    const companyId = await t.runMutation(api.companies.test.create, {
      gameId: "game123",
      industry: "A",
      name: "Test Company",
    });

    const user1 = await t.runMutation(api.users.test.create, {
      name: "Alice",
      email: "alice@test.com",
      role: "student",
      gameId: "game123",
      companyId,
    });

    const user2 = await t.runMutation(api.users.test.create, {
      name: "Bob",
      email: "bob@test.com",
      role: "student",
      gameId: "game123",
      companyId,
    });

    // Act: Both users focus on salary field
    const fieldId = `${companyId}:hiring:salary`;

    await t.runMutation(api.services.presenceFocus.updateFocus, {
      fieldId,
      userId: user1,
    });

    await t.runMutation(api.services.presenceFocus.updateFocus, {
      fieldId,
      userId: user2,
    });

    // Assert: Query returns both users focused
    const focusedUsers = await t.runQuery(api.services.presenceFocus.getFocusByField, {
      fieldId,
    });

    expect(focusedUsers).toHaveLength(2);
    expect(focusedUsers[0].user.name).toBe("Alice");
    expect(focusedUsers[1].user.name).toBe("Bob");
  });

  it("clears focus when user blurs field", async () => {
    const t = convexTest(schema);

    // Setup
    const companyId = await t.runMutation(api.companies.test.create, {
      gameId: "game123",
      industry: "A",
      name: "Test Company",
    });

    const user = await t.runMutation(api.users.test.create, {
      name: "Alice",
      email: "alice@test.com",
      role: "student",
      gameId: "game123",
      companyId,
    });

    const fieldId = `${companyId}:hiring:salary`;

    // Act: User focuses then clears
    await t.runMutation(api.services.presenceFocus.updateFocus, {
      fieldId,
      userId: user,
    });

    await t.runMutation(api.services.presenceFocus.clearFocus, {
      userId: user,
    });

    // Assert: No users focused
    const focusedUsers = await t.runQuery(api.services.presenceFocus.getFocusByField, {
      fieldId,
    });

    expect(focusedUsers).toHaveLength(0);
  });
});

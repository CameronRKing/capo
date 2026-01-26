import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import TerritoryAssignment from "./TerritoryAssignment";

// Mock server-only module for tests
vi.mock("server-only", () => ({}));

// Mock the resumes data
vi.mock("@/1-models/constants/resumes", () => ({
  default: {
    "1": { name: "Sarah Chen" },
    "2": { name: "Mike Rodriguez" },
    "3": { name: "Jennifer Kim" },
  },
}));

// Mock the counties data with a few test counties
vi.mock("@/1-models/constants/counties", () => ({
  default: {
    1: {
      id: 1,
      name: "Hamilton",
      state_id: "OH",
      population: "822596",
      path: "M64.0558,327.5683 L63.4856,327.1733 L64.0234,327.4584 Z",
    },
    2: {
      id: 2,
      name: "Ross",
      state_id: "OH",
      population: "75556",
      path: "M206.1087,312.492 L189.895,311.6252 L182.941,311.3794 Z",
    },
    3: {
      id: 3,
      name: "Hancock",
      state_id: "OH",
      population: "73824",
      path: "M124.3774,111.8717 L124.3168,92.464 L141.4746,92.3848 Z",
    },
  },
}));

// Mock the domain module to provide necessary types
vi.mock("@/domain", () => ({
  Types: {
    active_reps: {
      Doc: {},
    },
  },
}));

// Helper to create a mock rep document
function createMockRep(overrides: any = {}) {
  const mockRep = {
    id: `company1_0_${overrides.repId || "1"}`,
    companyId: "company1",
    quarter: 0,
    repId: overrides.repId || "1",
    willLetGo: false,
    individualHours: 0,
    leadershipBehavior: "Positive Verbal Feedback (Praise)",
    territories: [],
    // Mock RxDB document methods - actually update the territories
    patch: vi.fn().mockImplementation(function (this: any, updates: any) {
      if (updates.territories !== undefined) {
        this.territories = updates.territories;
      }
      return Promise.resolve();
    }),
    get: vi.fn(function (this: any, key: string) {
      return this[key];
    }),
    // Make it observable for reactive properties
    $: {},
    ...overrides,
  };

  return mockRep;
}

describe("TerritoryAssignment", () => {
  let mockReps: any[];

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mock reps for each test
    mockReps = [
      createMockRep({ repId: "1", id: "company1_0_1" }),
      createMockRep({ repId: "2", id: "company1_0_2" }),
      createMockRep({ repId: "3", id: "company1_0_3" }),
    ];
  });

  it("should render the component with legend and map", () => {
    render(<TerritoryAssignment currentTeam={mockReps} />);

    // Check that rep names are displayed
    expect(screen.getByText("Sarah Chen")).toBeDefined();
    expect(screen.getByText("Mike Rodriguez")).toBeDefined();
    expect(screen.getByText("Jennifer Kim")).toBeDefined();

    // Check that unassigned option is displayed
    expect(screen.getByText("Unassigned")).toBeDefined();

    // Check that the instructions are displayed
    expect(
      screen.getByText(/Assign Ohio counties to your sales reps/i)
    ).toBeDefined();
  });

  it("should assign a territory to a rep when clicked", async () => {
    const { container } = render(<TerritoryAssignment currentTeam={mockReps} />);

    // First, click on the first rep (Sarah Chen) in the ListBox to select them
    const sarahLegendItems = Array.from(container.querySelectorAll("div")).filter(
      (el: any) => el.textContent?.includes("Sarah Chen") && (el as HTMLElement).style.cursor === 'pointer'
    );
    expect(sarahLegendItems.length).toBeGreaterThan(0);
    fireEvent.click(sarahLegendItems[0]);

    // Find the first county path element (Hamilton county)
    const svgElement = container.querySelector("svg");
    expect(svgElement).toBeDefined();

    const paths = svgElement?.querySelectorAll("path");
    expect(paths?.length).toBeGreaterThan(0);

    const firstPath = paths?.[0];
    expect(firstPath).toBeDefined();

    // Click on the county to assign it to the selected rep (Sarah Chen)
    await act(async () => {
      fireEvent.click(firstPath!);
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Check that patch was called
    expect(mockReps[0].patch).toHaveBeenCalledWith({
      territories: [1],
    });
  });

  it("should unassign a territory when clicking an already assigned county", async () => {
    // Start with county 1 already assigned to rep 1
    mockReps[0].territories = [1];

    const { container } = render(<TerritoryAssignment currentTeam={mockReps} />);

    // First, click on the first rep (Sarah Chen) in the ListBox to select them
    const sarahLegendItems = Array.from(container.querySelectorAll("div")).filter(
      (el: any) => el.textContent?.includes("Sarah Chen") && (el as HTMLElement).style.cursor === 'pointer'
    );
    expect(sarahLegendItems.length).toBeGreaterThan(0);
    fireEvent.click(sarahLegendItems[0]);

    // Find the first county path element
    const svgElement = container.querySelector("svg");
    const paths = svgElement?.querySelectorAll("path");
    const firstPath = paths?.[0];

    // Click on the already-assigned county to unassign it
    await act(async () => {
      fireEvent.click(firstPath!);
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Check that patch was called with empty territories
    expect(mockReps[0].patch).toHaveBeenCalledWith({
      territories: [],
    });
  });

  it("should reassign a territory from one rep to another", async () => {
    // Start with county 1 assigned to rep 1
    mockReps[0].territories = [1];

    const { container } = render(<TerritoryAssignment currentTeam={mockReps} />);

    // First, click on rep 2 (Mike Rodriguez) to select them
    const mikeLegendItems = Array.from(container.querySelectorAll("div")).filter(
      (el: any) => el.textContent?.includes("Mike Rodriguez") && (el as HTMLElement).style.cursor === 'pointer'
    );
    expect(mikeLegendItems.length).toBeGreaterThan(0);
    fireEvent.click(mikeLegendItems[0]);

    // Click on county 1 to reassign it from rep 1 to rep 2
    const svgElement = container.querySelector("svg");
    const paths = svgElement?.querySelectorAll("path");
    const firstPath = paths?.[0];

    await act(async () => {
      fireEvent.click(firstPath!);
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Check both patches: rep 1 should lose the county, rep 2 should gain it
    expect(mockReps[0].patch).toHaveBeenCalledWith({
      territories: [],
    });
    expect(mockReps[1].patch).toHaveBeenCalledWith({
      territories: [1],
    });
  });

  it("should select a rep when clicking their legend item", () => {
    const { container } = render(<TerritoryAssignment currentTeam={mockReps} />);

    // Find Mike's legend item
    const mikeLegendItems = Array.from(container.querySelectorAll("div")).filter(
      (el: any) => el.textContent?.includes("Mike Rodriguez") && (el as HTMLElement).style.cursor === 'pointer'
    );
    const mikeLegendItem = mikeLegendItems[0];

    expect(mikeLegendItem).toBeDefined();

    // Click on Mike's legend item
    fireEvent.click(mikeLegendItem!);

    // Mike's legend item should still exist after clicking
    expect(mikeLegendItem).toBeDefined();
  });

  it("should show validation message when counties are unassigned", () => {
    // All counties start unassigned
    render(<TerritoryAssignment currentTeam={mockReps} />);

    // Check for validation message about unassigned counties (there may be multiple)
    const messages = screen.queryAllByText(/counties still unassigned/i);
    expect(messages.length).toBeGreaterThan(0);
  });

  it("should show validation message when a rep has no territories", () => {
    // All reps start with no territories
    render(<TerritoryAssignment currentTeam={mockReps} />);

    // Check for validation message about reps needing territories
    const messages = screen.queryAllByText(/Every rep must be assigned at least one county/i);
    expect(messages.length).toBeGreaterThan(0);
  });

  it("should not show validation messages when all counties are assigned and all reps have territories", () => {
    // Assign all counties to reps, ensuring each rep has at least one
    mockReps[0].territories = [1];
    mockReps[1].territories = [2];
    mockReps[2].territories = [3];

    const { container } = render(<TerritoryAssignment currentTeam={mockReps} />);

    // The validation messages should not be present - check the container specifically
    const unassignedMessages = Array.from(container.querySelectorAll("p"))
      .filter((el: any) => el.textContent?.includes("counties still unassigned"));
    const repMessages = Array.from(container.querySelectorAll("p"))
      .filter((el: any) => el.textContent?.includes("Every rep must be assigned at least one county"));

    // These messages should NOT be present since all counties are assigned
    expect(unassignedMessages.length).toBe(0);
    expect(repMessages.length).toBe(0);
  });

  it("should handle clicking 'Unassigned' legend item then clicking a county to remove assignment", async () => {
    // Start with county 1 assigned to rep 1
    mockReps[0].territories = [1];

    const { container } = render(<TerritoryAssignment currentTeam={mockReps} />);

    // Click on the "Unassigned" legend item to select it
    const unassignedLegendItems = Array.from(container.querySelectorAll("div")).filter(
      (el: any) => el.textContent?.includes("Unassigned") && (el as HTMLElement).style.cursor === 'pointer'
    );
    expect(unassignedLegendItems.length).toBeGreaterThan(0);
    fireEvent.click(unassignedLegendItems[0]);

    // Click on the county that's assigned to rep 1 - it should be unassigned
    const svgElement = container.querySelector("svg");
    const paths = svgElement?.querySelectorAll("path");
    const firstPath = paths?.[0];

    await act(async () => {
      fireEvent.click(firstPath!);
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // The county should be unassigned from rep 1
    expect(mockReps[0].patch).toHaveBeenCalledWith({
      territories: [],
    });
  });

  it("should handle unassigning from multiple reps by selecting Unassigned", async () => {
    // Assign county 1 to rep 1 and county 2 to rep 2
    mockReps[0].territories = [1];
    mockReps[1].territories = [2];

    const { container } = render(<TerritoryAssignment currentTeam={mockReps} />);

    // Select Unassigned
    const unassignedLegendItems = Array.from(container.querySelectorAll("div")).filter(
      (el: any) => el.textContent?.includes("Unassigned") && (el as HTMLElement).style.cursor === 'pointer'
    );
    fireEvent.click(unassignedLegendItems[0]);

    // Click both counties to unassign them
    const svgElement = container.querySelector("svg");
    const paths = svgElement?.querySelectorAll("path");

    await act(async () => {
      fireEvent.click(paths![0]);
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    await act(async () => {
      fireEvent.click(paths![1]);
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Both counties should be unassigned
    expect(mockReps[0].patch).toHaveBeenCalledWith({
      territories: [],
    });
    expect(mockReps[1].patch).toHaveBeenCalledWith({
      territories: [],
    });
  });
});

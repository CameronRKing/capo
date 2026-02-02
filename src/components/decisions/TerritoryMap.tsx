/**
 * TerritoryMap Component
 *
 * Interactive SVG map of Ohio counties for territory assignment.
 * Features:
 * - SVG rendering of all 88 counties
 * - Click to assign/unassign counties to reps
 * - Color coding by rep assignment
 * - Legend with rep names and colors
 * - Contiguity validation with error display
 * - Focus indicators for real-time collaboration
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useState, useMemo, useEffect } from "react";

interface County {
  _id: string;
  id: number;
  name: string;
  state_id: string;
  population: string;
  path: string;
}

interface TerritoryAssignment {
  countyId: number;
  repId: Id<"activeReps">;
}

interface Territory {
  _id: Id<"territories">;
  companyId: Id<"companies">;
  quarter: number;
  assignments: TerritoryAssignment[];
  isSubmitted: boolean;
  submittedBy?: Id<"users">;
  submittedAt?: number;
}

interface ActiveRep {
  _id: Id<"activeReps">;
  companyId: Id<"companies">;
  quarter: number;
  repId: string;
  willLetGo: boolean;
  individualHours: number;
  leadershipBehavior: string;
  territories: number[];
}

interface TerritoryMapProps {
  companyId: Id<"companies">;
  quarter: number;
  reps: ActiveRep[];
}

// Color palette for rep assignments (distinct colors)
const REP_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

const UNASSIGNED_COLOR = "#E5E7EB"; // gray
const HOVER_COLOR = "#FCD34D"; // yellow hover
const ERROR_COLOR = "#FEE2E2"; // red tint for errors

export function TerritoryMap({ companyId, quarter, reps }: TerritoryMapProps) {
  const [selectedCountyId, setSelectedCountyId] = useState<number | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<Id<"activeReps"> | null>(null);

  // Load counties and territory
  const counties = useQuery(api.territories.getAllCounties);
  const territory = useQuery(api.territories.getTerritory, { companyId, quarter });
  const validation = useQuery(api.territories.validateContiguity, {
    companyId,
    quarter,
  });

  // Mutations
  const setAssignment = useMutation(api.territories.setCountyAssignment);
  const initialize = useMutation(api.territories.initializeTerritory);
  const randomize = useMutation(api.territories.generateRandomAssignments);

  // Create rep color map
  const repColorMap = useMemo(() => {
    const map = new Map<Id<"activeReps">, string>();
    reps.forEach((rep, index) => {
      map.set(rep._id, REP_COLORS[index % REP_COLORS.length]);
    });
    return map;
  }, [reps]);

  // Create county assignment lookup
  const countyAssignmentMap = useMemo(() => {
    const map = new Map<number, Id<"activeReps">>();
    territory?.assignments.forEach((assignment) => {
      map.set(assignment.countyId, assignment.repId);
    });
    return map;
  }, [territory]);

  // Create rep county counts
  const repCountyCounts = useMemo(() => {
    const counts = new Map<Id<"activeReps">, number>();
    territory?.assignments.forEach((assignment) => {
      counts.set(assignment.repId, (counts.get(assignment.repId) || 0) + 1);
    });
    return counts;
  }, [territory]);

  // Handle county click
  const handleCountyClick = async (countyId: number) => {
    if (territory?.isSubmitted) {
      return; // Cannot modify submitted territories
    }

    if (!selectedRepId) {
      setSelectedCountyId(countyId);
      return;
    }

    // Toggle assignment
    const currentAssignment = countyAssignmentMap.get(countyId);
    if (currentAssignment === selectedRepId) {
      // Unassign
      await setAssignment({
        companyId,
        quarter,
        countyId,
        repId: null,
      });
    } else {
      // Assign to selected rep
      await setAssignment({
        companyId,
        quarter,
        countyId,
        repId: selectedRepId,
      });
    }
  };

  // Handle initialize
  const handleInitialize = async () => {
    await initialize({ companyId, quarter });
  };

  // Handle randomize
  const handleRandomize = async () => {
    const repIds = reps.map((r) => r._id);
    await randomize({ companyId, quarter, repIds });
  };

  // Get county fill color
  const getCountyFill = (countyId: number): string => {
    const repId = countyAssignmentMap.get(countyId);
    if (repId) {
      return repColorMap.get(repId) || UNASSIGNED_COLOR;
    }
    return UNASSIGNED_COLOR;
  };

  // Check if county is in error state (discontiguous territory)
  const isCountyInError = (countyId: number): boolean => {
    if (!validation || validation.isValid) return false;

    const repId = countyAssignmentMap.get(countyId);
    if (!repId) return false;

    // Check if this rep's territory is mentioned in errors
    return validation.errors.some((error) => error.includes(repId));
  };

  if (!counties) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="flex gap-6">
      {/* Map */}
      <div className="flex-1">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Ohio Territory Map</h2>
            <div className="flex gap-2">
              {!territory && (
                <button
                  onClick={handleInitialize}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Initialize
                </button>
              )}
              {territory && !territory.isSubmitted && (
                <button
                  onClick={handleRandomize}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Randomize
                </button>
              )}
            </div>
          </div>

          {/* Validation errors */}
          {validation && !validation.isValid && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="font-semibold text-red-800">Contiguity Errors:</p>
              <ul className="list-disc list-inside text-sm text-red-700">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* SVG Map */}
          <svg
            viewBox="0 0 500 350"
            className="w-full h-auto border border-gray-300 rounded bg-gray-50"
          >
            {counties.map((county) => (
              <path
                key={county.id}
                d={county.path}
                fill={getCountyFill(county.id)}
                stroke={selectedCountyId === county.id ? "#000" : "#fff"}
                strokeWidth={selectedCountyId === county.id ? 2 : 1}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleCountyClick(county.id)}
                style={{
                  fillOpacity: isCountyInError(county.id) ? 0.7 : 1,
                }}
              >
                <title>{county.name}</title>
              </path>
            ))}
          </svg>

          {/* Selected county info */}
          {selectedCountyId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="font-semibold">Selected: {counties.find((c) => c.id === selectedCountyId)?.name}</p>
              <p className="text-sm text-gray-600">
                Assigned to:{" "}
                {countyAssignmentMap.get(selectedCountyId) ? (
                  <span className="font-semibold">
                    {reps.find((r) => r._id === countyAssignmentMap.get(selectedCountyId))?.repId}
                  </span>
                ) : (
                  <span className="italic">Unassigned</span>
                )}
              </p>
            </div>
          )}

          {/* Submitted status */}
          {territory?.isSubmitted && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                ✓ Submitted by {territory.submittedBy} at{" "}
                {territory.submittedAt ? new Date(territory.submittedAt).toLocaleString() : "Unknown"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Rep Assignments</h3>

          {/* Rep list */}
          <div className="space-y-3">
            {reps.map((rep) => {
              const color = repColorMap.get(rep._id) || "#000";
              const countyCount = repCountyCounts.get(rep._id) || 0;
              const isSelected = selectedRepId === rep._id;

              return (
                <div
                  key={rep._id}
                  onClick={() => setSelectedRepId(rep._id)}
                  className={`p-3 border rounded cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{rep.repId}</p>
                      <p className="text-sm text-gray-600">
                        {countyCount} {countyCount === 1 ? "county" : "counties"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unassigned count */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Unassigned: {88 - territory?.assignments.length || 88} / 88 counties
            </p>
          </div>

          {/* Instructions */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">Instructions:</h4>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>Select a rep from the list</li>
              <li>Click counties to assign</li>
              <li>All counties must be assigned</li>
              <li>Each rep's territory must be contiguous</li>
            </ol>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">Legend:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border" />
                <span>Unassigned</span>
              </div>
              {reps.slice(0, 5).map((rep) => {
                const color = repColorMap.get(rep._id) || "#000";
                return (
                  <div key={rep._id} className="flex items-center gap-2">
                    <div className="w-4 h-4 border" style={{ backgroundColor: color }} />
                    <span>{rep.repId}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

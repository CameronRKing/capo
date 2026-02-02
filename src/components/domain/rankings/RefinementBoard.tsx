/**
 * RefinementBoard Component - Three-column drag-drop refinement UI
 *
 * Phase 2 refinement interface where students see all three groups (A/B/C)
 * simultaneously and can drag profiles within and between groups.
 *
 * Features:
 * - Three-column layout (Group A, Group B, Group C)
 * - Drag-drop with @dnd-kit
 * - Reorder within groups (drag to new position)
 * - Reassign between groups (drag to different column)
 * - Visual feedback during drag (opacity, elevation, drop zones)
 * - Auto-save on drag-drop (via saveRankingsBatch)
 * - Optimistic UI updates
 * - Teammate rankings display (read-only)
 * - Real-time collaboration indicators
 *
 * @example
 * ```tsx
 * function RefinementPage() {
 *   const user = useCurrentUser();
 *   const myRankings = useQuery(api.rankings.getMyRankings, {
 *     companyId: user.companyId,
 *   });
 *   const teammateRankings = useQuery(api.rankings.getTeammateRankings, {
 *     companyId: user.companyId,
 *   });
 *   const saveRankings = useMutation(api.rankings.saveRankingsBatch);
 *
 *   return (
 *     <RefinementBoard
 *       myRankings={myRankings}
 *       teammateRankings={teammateRankings}
 *       onSave={saveRankings}
 *       companyId={user.companyId}
 *       userId={user._id}
 *     />
 *   );
 * }
 * ```
 */

import React, { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { ResumeCard } from "./ResumeCard";
import { FacePile } from "../../collaboration/FacePile";

export interface RankingItem {
  repId: string;
  name: string;
  education: string;
  experience: string;
  intelligence: number;
  myers_briggs: string;
  group: "A" | "B" | "C";
  rank: number;
}

export interface GroupedRankings {
  A: RankingItem[];
  B: RankingItem[];
  C: RankingItem[];
}

export interface TeammateRankings {
  [userId: string]: {
    userName: string;
    rankings: GroupedRankings;
  };
}

export interface RefinementBoardProps {
  /** Current user's rankings (grouped by A/B/C) */
  myRankings?: GroupedRankings;
  /** Teammates' rankings (read-only) */
  teammateRankings?: TeammateRankings;
  /** Save mutation from Convex */
  onSave: (args: {
    companyId: Id<"companies">;
    rankings: Array<{
      repId: string;
      group: "A" | "B" | "C";
      rank: number;
    }>;
  }) => Promise<void>;
  /** Company ID for presence */
  companyId: Id<"companies"> | string;
  /** Current user ID */
  userId: Id<"users"> | string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SortableItem - Wrapper for ResumeCard with sortable functionality
 */
function SortableItem({
  item,
  companyId,
  userId,
}: {
  item: RankingItem;
  companyId: Id<"companies"> | string;
  userId: Id<"users"> | string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${item.group}:${item.repId}`,
    data: {
      type: "ranking",
      ranking: item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ResumeCard
        repId={item.repId}
        name={item.name}
        education={item.education}
        experience={item.experience}
        intelligence={item.intelligence}
        myers_briggs={item.myers_briggs}
        isDragging={isDragging}
        attributes={attributes}
        listeners={listeners}
        setNodeRef={setNodeRef}
        style={style}
        companyId={companyId}
        userId={userId}
      />
    </div>
  );
}

/**
 * RefinementColumn - Single column for a group (A/B/C)
 */
function RefinementColumn({
  group,
  items,
  companyId,
  userId,
  teammateRankings,
}: {
  group: "A" | "B" | "C";
  items: RankingItem[];
  companyId: Id<"companies"> | string;
  userId: Id<"users"> | string;
  teammateRankings?: TeammateRankings;
}) {
  const itemIds = items.map((item) => `${group}:${item.repId}`);

  // Group colors
  const groupColors = {
    A: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    B: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    C: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  };

  const groupLabels = {
    A: "Group A - Top Tier",
    B: "Group B - Middle Tier",
    C: "Group C - Lower Tier",
  };

  return (
    <div className={`
      flex-1 flex flex-col
      ${groupColors[group]}
      border-2 rounded-lg
      min-w-[300px]
      transition-colors duration-200
    `}>
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {groupLabels[group]}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {items.length} {items.length === 1 ? "profile" : "profiles"}
        </p>
      </div>

      {/* Drop Zone / Sortable List */}
      <SortableContext
        items={itemIds}
        strategy={verticalListSortingStrategy}
        id={group}
      >
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Drop profiles here</p>
            </div>
          ) : (
            items.map((item) => (
              <SortableItem
                key={`${group}:${item.repId}`}
                item={item}
                companyId={companyId}
                userId={userId}
              />
            ))
          )}
        </div>
      </SortableContext>

      {/* Teammate Rankings Summary */}
      {teammateRankings && Object.keys(teammateRankings).length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Teammate Rankings
          </p>
          <div className="space-y-2">
            {Object.entries(teammateRankings).map(([teammateId, data]) => {
              const count = data.rankings[group]?.length ?? 0;
              return (
                <div
                  key={teammateId}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {data.userName}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {count} in {group}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * RefinementBoard - Main three-column drag-drop interface
 */
export function RefinementBoard({
  myRankings,
  teammateRankings,
  onSave,
  companyId,
  userId,
  className = "",
}: RefinementBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticRankings, setOptimisticRankings] = useState<GroupedRankings>(
    myRankings ?? { A: [], B: [], C: [] }
  );
  const [isSaving, setIsSaving] = useState(false);

  // Update optimistic rankings when myRankings changes
  React.useEffect(() => {
    if (myRankings) {
      setOptimisticRankings(myRankings);
    }
  }, [myRankings]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag threshold
      },
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end - save rankings
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || !optimisticRankings) return;

      const activeIdStr = active.id as string;
      const [activeGroup, activeRepId] = activeIdStr.split(":") as [
        "A" | "B" | "C",
        string
      ];
      const overIdStr = over.id as string;
      const [overGroup, overRepId] = overIdStr.split(":") as [
        "A" | "B" | "C",
        string
      ];

      // Find the active item
      const activeItem = optimisticRankings[activeGroup].find(
        (item) => item.repId === activeRepId
      );

      if (!activeItem) return;

      // Create new rankings array
      const newRankings = {
        A: [...optimisticRankings.A],
        B: [...optimisticRankings.B],
        C: [...optimisticRankings.C],
      };

      // Remove from old group
      newRankings[activeGroup] = newRankings[activeGroup].filter(
        (item) => item.repId !== activeRepId
      );

      // Calculate new rank
      if (activeGroup === overGroup) {
        // Reordering within same group
        const overIndex = newRankings[overGroup].findIndex(
          (item) => item.repId === overRepId
        );

        if (overIndex === -1) {
          // Dragging to empty spot at end
          newRankings[overGroup].push({
            ...activeItem,
            group: overGroup,
            rank: newRankings[overGroup].length,
          });
        } else {
          // Insert at new position
          newRankings[overGroup].splice(overIndex, 0, {
            ...activeItem,
            group: overGroup,
            rank: overIndex,
          });
        }
      } else {
        // Moving to different group - append to end
        newRankings[overGroup].push({
          ...activeItem,
          group: overGroup,
          rank: newRankings[overGroup].length,
        });
      }

      // Re-rank all items in all groups
      ["A", "B", "C" as const].forEach((group) => {
        newRankings[group] = newRankings[group].map((item, index) => ({
          ...item,
          rank: index,
        }));
      });

      // Optimistic update
      setOptimisticRankings(newRankings);

      // Save to backend
      setIsSaving(true);
      try {
        const flatRankings = [
          ...newRankings.A.map((r) => ({ repId: r.repId, group: r.group as "A" | "B" | "C", rank: r.rank })),
          ...newRankings.B.map((r) => ({ repId: r.repId, group: r.group as "A" | "B" | "C", rank: r.rank })),
          ...newRankings.C.map((r) => ({ repId: r.repId, group: r.group as "A" | "B" | "C", rank: r.rank })),
        ];

        await onSave({
          companyId: companyId as Id<"companies">,
          rankings: flatRankings,
        });
      } catch (error) {
        console.error("Failed to save rankings:", error);
        // Revert on error
        setOptimisticRankings(myRankings ?? { A: [], B: [], C: [] });
      } finally {
        setIsSaving(false);
      }
    },
    [optimisticRankings, myRankings, onSave, companyId]
  );

  // Find active item for drag overlay
  const activeItem =
    activeId && optimisticRankings
      ? (() => {
          const [group, repId] = (activeId as string).split(":") as [
            "A" | "B" | "C",
            string
          ];
          return optimisticRankings[group].find((item) => item.repId === repId);
        })()
      : null;

  if (!optimisticRankings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Loading rankings...</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Save Status Indicator */}
      {isSaving && (
        <div className="absolute top-4 right-4 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Saving...
        </div>
      )}

      {/* DnD Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Three Column Layout */}
        <div className="flex gap-4 h-full">
          <RefinementColumn
            group="A"
            items={optimisticRankings.A}
            companyId={companyId}
            userId={userId}
            teammateRankings={teammateRankings}
          />
          <RefinementColumn
            group="B"
            items={optimisticRankings.B}
            companyId={companyId}
            userId={userId}
            teammateRankings={teammateRankings}
          />
          <RefinementColumn
            group="C"
            items={optimisticRankings.C}
            companyId={companyId}
            userId={userId}
            teammateRankings={teammateRankings}
          />
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem && (
            <div className="rotate-3 scale-105">
              <ResumeCard
                repId={activeItem.repId}
                name={activeItem.name}
                education={activeItem.education}
                experience={activeItem.experience}
                intelligence={activeItem.intelligence}
                myers_briggs={activeItem.myers_briggs}
                isDragging={true}
                attributes={{}}
                listeners={{}}
                setNodeRef={() => {}}
                companyId={companyId}
                userId={userId}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

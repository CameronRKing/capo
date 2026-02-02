/**
 * Presence Test Page - Manual testing for presence UI components
 *
 * This page demonstrates all presence collaboration components:
 * - FacePile (avatar stack)
 * - FocusIndicator (multi-user input focus)
 * - HoverTooltip (offline users tooltip)
 * - LastEdited (timestamp display)
 * - UserCursors (on-page cursors)
 *
 * To test:
 * 1. Open this page in multiple browser windows/tabs
 * 2. Log in as different users in each window
 * 3. Observe real-time presence updates
 * 4. Test focus indicators by clicking in different inputs
 * 5. Verify avatars update when users come/go
 */

import { useState } from "react";
import { FacePile } from "../../components/collaboration/FacePile";
import { FocusIndicator } from "../../components/collaboration/FocusIndicator";
import { HoverTooltip, QuickOfflineBadge } from "../../components/collaboration/HoverTooltip";
import { LastEdited, LastEditedCompact } from "../../components/collaboration/LastEdited";
import { UserCursors } from "../../components/collaboration/UserCursors";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Mock online users for testing (without auth)
 */
const mockOnlineUsers = [
  {
    user: {
      _id: "user1" as Id<"users">,
      name: "Alice Johnson",
      email: "alice@example.com",
    },
  },
  {
    user: {
      _id: "user2" as Id<"users">,
      name: "Bob Smith",
      email: "bob@example.com",
    },
  },
  {
    user: {
      _id: "user3" as Id<"users">,
      name: "Carol Davis",
      email: "carol@example.com",
    },
  },
];

/**
 * Mock offline users
 */
const mockOfflineUsers = [
  {
    _id: "user4" as Id<"users">,
    name: "David Wilson",
    email: "david@example.com",
  },
  {
    _id: "user5" as Id<"users">,
    name: "Eva Martinez",
    email: "eva@example.com",
  },
];

/**
 * Mock focused users for testing FocusIndicator
 */
const mockFocusedUsers = [
  {
    user: {
      _id: "user1" as Id<"users">,
      name: "Alice Johnson",
      email: "alice@example.com",
    },
    timestamp: Date.now(),
  },
];

export default function PresenceTestPage() {
  // State for testing LastEdited component
  const [lastEdited, setLastEdited] = useState<{
    userName: string;
    timestamp: number;
  } | null>(null);

  // State for testing UserCursors
  const [cursors] = useState<Map<string, { x: number; y: number }>>(
    new Map([
      ["user2", { x: 400, y: 300 }],
      ["user3", { x: 600, y: 400 }],
    ])
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Presence UI Components Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Open this page in multiple browser windows to test real-time
            collaboration features.
          </p>
        </div>

        {/* FacePile Component */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">FacePile Component</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Displays overlapping avatars for online users. Fixed-size container
            prevents layout shift.
          </p>

          <div className="space-y-4">
            {/* Online users */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm font-medium">Online:</span>
              <FacePile users={mockOnlineUsers} maxVisible={5} size={32} />
              <span className="text-sm text-gray-500">
                {mockOnlineUsers.length} online
              </span>
            </div>

            {/* With offline users */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm font-medium">With Offline:</span>
              <FacePile users={mockOnlineUsers} maxVisible={3} size={32} />
              <HoverTooltip users={mockOfflineUsers} />
            </div>

            {/* Quick offline badge */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm font-medium">Badge Style:</span>
              <FacePile users={mockOnlineUsers} maxVisible={4} size={32} />
              <QuickOfflineBadge users={mockOfflineUsers} />
            </div>
          </div>
        </section>

        {/* FocusIndicator Component */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">
            FocusIndicator Component
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Shows avatars of users focused on an input field. Purple border
            appears when multiple users focused.
          </p>

          <div className="space-y-6">
            {/* Single input without focus */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Annual Salary (no one focused)
              </label>
              <input
                type="number"
                defaultValue="50000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
              />
            </div>

            {/* Input with focus indicator (mock) */}
            <FocusIndicator
              companyId="company123"
              entity="hiring"
              fieldPath="salary"
              userId="current-user"
              label="Commission Rate (with focus)"
            >
              <input
                type="number"
                defaultValue="5"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
              />
            </FocusIndicator>

            {/* Input with last edited */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Benefits Package
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded">
                <option>Bronze (5%)</option>
                <option>Silver (12% + $400)</option>
                <option>Gold (17% + $600)</option>
              </select>
              <LastEdited
                data={{
                  userName: "Bob Smith",
                  timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
                }}
                className="mt-2"
              />
            </div>
          </div>
        </section>

        {/* LastEdited Component */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">LastEdited Component</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Shows "Last edited by" information with relative and/or exact
            timestamps.
          </p>

          <div className="space-y-4">
            {/* Relative time */}
            <LastEdited
              data={{
                userName: "Alice Johnson",
                timestamp: Date.now() - 1000 * 60 * 2, // 2 minutes ago
              }}
              showRelative={true}
              showExact={false}
            />

            {/* Relative + exact time */}
            <LastEdited
              data={{
                userName: "Bob Smith",
                timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
              }}
              showRelative={true}
              showExact={true}
            />

            {/* With avatar */}
            <LastEdited
              data={{
                userName: "Carol Davis",
                timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
              }}
              showAvatar={true}
              showRelative={true}
            />

            {/* Compact version */}
            <LastEditedCompact
              userName="David Wilson"
              timestamp={Date.now() - 1000 * 60 * 30}
            />

            {/* Interactive demo */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <button
                onClick={() =>
                  setLastEdited({
                    userName: "You",
                    timestamp: Date.now(),
                  })
                }
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Simulate Edit
              </button>
              {lastEdited && (
                <LastEdited data={lastEdited} className="mt-2" />
              )}
            </div>
          </div>
        </section>

        {/* UserCursors Component */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">UserCursors Component</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Shows other users' cursor positions on the page with colored labels.
          </p>

          <div className="relative h-64 bg-gray-50 dark:bg-gray-700 rounded overflow-hidden">
            <UserCursors
              users={mockOnlineUsers}
              cursors={cursors}
              currentUserId="user1"
            />

            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Move your mouse around to see cursor tracking (placeholder - requires
              real-time cursor sync)
            </div>
          </div>
        </section>

        {/* HoverTooltip Component */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">HoverTooltip Component</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Hover over the offline indicator to see a tooltip with offline users.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm">Offline users:</span>
              <HoverTooltip users={mockOfflineUsers} />
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm">Custom trigger:</span>
              <HoverTooltip
                users={mockOfflineUsers}
                trigger={
                  <button className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500">
                    View Offline (3)
                  </button>
                }
              />
            </div>
          </div>
        </section>

        {/* Color Assignment Test */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">
            User Color Assignment
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Each user gets a consistent color based on their ID. Colors are
            accessible and distinct.
          </p>

          <div className="grid grid-cols-5 gap-4">
            {mockOnlineUsers.map((u) => {
              // Import getUserColor locally for this demo
              const getUserColor = (userId: string) => {
                const colors = [
                  "#3b82f6",
                  "#ef4444",
                  "#22c55e",
                  "#f59e0b",
                  "#8b5cf6",
                  "#ec4899",
                  "#06b6d4",
                  "#f97316",
                ];
                const hash = userId.split("").reduce((acc, char) => {
                  return acc + char.charCodeAt(0);
                }, 0);
                return colors[hash % colors.length];
              };

              const color = getUserColor(u.user._id);

              return (
                <div key={u.user._id} className="text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: color }}
                  >
                    {u.user.name[0]}
                  </div>
                  <p className="text-xs mt-2">{u.user.name}</p>
                  <p className="text-xs text-gray-500">{color}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
            Testing Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>
              Open this page in 2-3 browser windows or incognito tabs
            </li>
            <li>
              In each window, observe the FacePile showing online users
            </li>
            <li>
              Click in different input fields to see focus indicators
            </li>
            <li>
              Hover over "X people offline" to see the tooltip
            </li>
            <li>
              Click "Simulate Edit" to see LastEdited timestamps
            </li>
            <li>
              Verify colors are consistent for each user across components
            </li>
            <li>
              Check that layout doesn't shift when avatars appear/disappear
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}

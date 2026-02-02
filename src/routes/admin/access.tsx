/**
 * Admin Access Management Route
 *
 * Two-tab interface for managing user access:
 * 1. Pending Requests Tab - List and approve/deny pending requests
 * 2. Direct Grant Tab - Form to directly grant access with game/company assignment
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { ApprovalModal } from "@/components/ApprovalModal";

export const Route = createFileRoute("/admin/access")({
  component: AdminAccessPage,
});

type Tab = "pending" | "direct-grant";

function AdminAccessPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [selectedRequestId, setSelectedRequestId] = useState<
    Id<"accessRequests"> | null
  >(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const pendingRequests = useQuery(api.myFunctions.admin.accessRequests.listPending);
  const games = useQuery(api.myFunctions.admin.accessRequests.listGames);
  const approveRequest = useMutation(api.myFunctions.admin.accessRequests.approve);
  const denyRequest = useMutation(api.myFunctions.admin.accessRequests.deny);

  // Direct grant form state
  const [directGrantForm, setDirectGrantForm] = useState({
    name: "",
    email: "",
    role: "" as "teacher" | "student" | "",
    gameId: "" as Id<"games"> | "",
    companyId: "" as Id<"companies"> | "",
  });

  const handleApproveClick = (requestId: Id<"accessRequests">) => {
    setSelectedRequestId(requestId);
    setShowApprovalModal(true);
  };

  const handleDeny = async (requestId: Id<"accessRequests">) => {
    if (!confirm("Are you sure you want to deny this request?")) return;

    try {
      await denyRequest({ requestId });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleApproveSubmit = async (
    gameId: Id<"games"> | undefined,
    companyId: Id<"companies"> | undefined
  ) => {
    if (!selectedRequestId) return;

    try {
      await approveRequest({
        requestId: selectedRequestId,
        gameId,
        companyId,
      });
      setShowApprovalModal(false);
      setSelectedRequestId(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDirectGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation would call accessRequests.create then approve
    alert("Direct grant feature - would create and approve request");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Access Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage user access requests and permissions
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "pending"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              Pending Requests
              {pendingRequests && pendingRequests.length > 0 && (
                <span className="ml-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 py-0.5 px-2 rounded-full text-xs">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("direct-grant")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "direct-grant"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              Direct Grant
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "pending" && (
          <PendingRequestsTab
            requests={pendingRequests}
            onApprove={handleApproveClick}
            onDeny={handleDeny}
            loading={!pendingRequests}
          />
        )}

        {activeTab === "direct-grant" && (
          <DirectGrantTab
            form={directGrantForm}
            onChange={setDirectGrantForm}
            onSubmit={handleDirectGrant}
            games={games}
          />
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequestId && (
        <ApprovalModal
          requestId={selectedRequestId}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedRequestId(null);
          }}
          onSubmit={handleApproveSubmit}
        />
      )}
    </div>
  );
}

// Pending Requests Tab Component
function PendingRequestsTab({
  requests,
  onApprove,
  onDeny,
  loading,
}: {
  requests: any[] | undefined;
  onApprove: (id: any) => void;
  onDeny: (id: any) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No pending requests
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          All access requests have been processed.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {requests.map((request) => (
          <li key={request._id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-300 font-semibold">
                      {request.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {request.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {request.email}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      request.role === "teacher"
                        ? "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                        : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    }`}
                  >
                    {request.role.charAt(0).toUpperCase() + request.role.slice(1)}
                  </span>
                  <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">
                    Requested{" "}
                    {new Date(request._creationTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex space-x-3">
                <button
                  onClick={() => onApprove(request._id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </button>
                <button
                  onClick={() => onDeny(request._id)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Deny
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Direct Grant Tab Component
function DirectGrantTab({
  form,
  onChange,
  onSubmit,
  games,
}: {
  form: any;
  onChange: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  games: any[] | undefined;
}) {
  const companies = useQuery(
    api.myFunctions.admin.accessRequests.listCompanies,
    form.gameId ? { gameId: form.gameId as any } : "skip"
  );

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Grant Access Directly
      </h3>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) =>
                onChange({
                  ...form,
                  role: e.target.value as "teacher" | "student",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select role...</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          {/* Game */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Game
            </label>
            <select
              value={form.gameId}
              onChange={(e) =>
                onChange({ ...form, gameId: e.target.value, companyId: "" })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select game...</option>
              {games?.map((game) => (
                <option key={game._id} value={game._id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          {/* Company (only for students) */}
          {form.role === "student" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company
              </label>
              <select
                value={form.companyId}
                onChange={(e) =>
                  onChange({ ...form, companyId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                required={form.role === "student"}
              >
                <option value="">Select company...</option>
                {companies?.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name} ({company.industry})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Grant Access
          </button>
        </div>
      </form>
    </div>
  );
}

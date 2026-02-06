/**
 * Leadership Decision Route
 *
 * Route for entering leadership phase decisions.
 * Loads working decision, displays form, handles submit.
 *
 * @route /student/decisions/leadership
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LeadershipDecisionForm } from "@/components/decisions/LeadershipDecisionForm";
import { ErrorPage } from "@/components/ErrorPage";
import { AlertCircle } from "lucide-react";

/**
 * Leadership Decision Page Component
 */
function LeadershipDecisionPage() {
  const user = useCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Not authenticated</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  // For now, we'll use quarter 1. In production, this would come from the game state.
  const quarter = 1;

  return <LeadershipDecisionForm companyId={user.companyId} quarter={quarter} user={user} />;
}

/**
 * Route definition with loader
 */
export const Route = createFileRoute("/student/decisions/leadership")({
  component: LeadershipDecisionPage,
  errorComponent: ({ error }) => <ErrorPage error={error} />,
  loader: async ({ context }) => {
    // Check authentication
    const user = await context.convex?.query(api.users.getCurrent);
    if (!user) {
      throw redirect({ to: "/login" });
    }

    // Check if user is a student
    if (user.role !== "student") {
      throw redirect({ to: "/admin/access" });
    }

    return { user };
  },
});

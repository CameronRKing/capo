/**
 * Student Reports Page - /student/reports
 *
 * Provides students with access to their company's performance reports:
 * - Financial reports (sales, margin, net income)
 * - Hiring outcome reports (new hires, retained, poached reps)
 * - Representative performance reports (sales, growth, satisfaction)
 *
 * Features:
 * - Quarter navigation to view historical reports
 * - Report type tabs (Financial, Hiring, Performance)
 * - Dark mode support
 * - Responsive layout
 *
 * Access Control:
 * - Only accessible by authenticated students
 * - Students see only their company's reports
 * - Data is filtered by RLS queries
 *
 * @route /student/reports
 */

import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import { ReportNavigation, ReportType } from "../../../components/reports/ReportNavigation";
import { ReportCard } from "../../../components/reports/ReportCard";
import { FinancialReport } from "../../../components/reports/FinancialReport";
import { HiringOutcomeReport } from "../../../components/reports/HiringOutcomeReport";
import { RepPerformanceReport } from "../../../components/reports/RepPerformanceReport";

/**
 * Loading State Component
 */
function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
      </div>
    </div>
  );
}

/**
 * Access Denied Component
 */
function AccessDenied({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md">
        <h1 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
          Access Denied
        </h1>
        <p className="text-red-700 dark:text-red-400">{message}</p>
      </div>
    </div>
  );
}

/**
 * No Reports Component
 */
function NoReports({ quarter }: { quarter: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Reports Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Reports for Quarter {quarter} are not yet available. Please check back later.
        </p>
      </div>
    </div>
  );
}

/**
 * StudentReportsPage Component
 *
 * Main reports page for students with navigation and report display.
 */
function StudentReportsPage() {
  const user = useCurrentUser();
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [reportType, setReportType] = useState<ReportType>("financial");

  // Access control checks
  if (!user) {
    return <LoadingState />;
  }

  if (user.role !== "student") {
    return <AccessDenied message="This page is only accessible to students." />;
  }

  if (!user.companyId) {
    return <AccessDenied message="You must be assigned to a company before viewing reports." />;
  }

  if (!user.gameId) {
    return <AccessDenied message="You must be assigned to a game before viewing reports." />;
  }

  // Load game data to get available quarters
  const game = useQuery(api.games.getGame, { gameId: user.gameId });

  // Parse quarter number from selection (e.g., "Q1" -> 1)
  const quarterNumber = parseInt(selectedQuarter.replace("Q", ""), 10);

  // Load reports for the selected quarter
  const reports = useQuery(
    api.reports.getReportsByCompany,
    user.companyId ? { companyId: user.companyId, quarter: quarterNumber } : "skip"
  );

  // Generate available quarters based on game progress
  const availableQuarters = React.useMemo(() => {
    if (!game) return ["Q1"];
    const currentQ = game.currentQuarter;
    const quarters = [];
    for (let i = 1; i <= currentQ; i++) {
      quarters.push(`Q${i}`);
    }
    return quarters;
  }, [game]);

  // Transform report data for components
  const financialData = React.useMemo(() => {
    if (!reports?.financials) return undefined;
    return {
      summary: {
        sales: reports.financials.totalSales,
        grossMargin: reports.financials.grossMargin,
        netIncome: reports.financials.netIncome,
      },
      lineItems: [
        {
          id: "sales",
          name: "Total Sales",
          amount: reports.financials.totalSales,
          type: "revenue" as const,
        },
        {
          id: "gross-margin",
          name: "Gross Margin",
          amount: reports.financials.grossMargin,
          type: "subtotal" as const,
        },
        {
          id: "rep-salaries",
          name: "Sales Rep Salaries",
          amount: reports.financials.totalRepSalaries,
          type: "expense" as const,
        },
        {
          id: "commissions",
          name: "Commissions",
          amount: reports.financials.totalCommissions,
          type: "expense" as const,
        },
        {
          id: "benefits",
          name: "Benefits",
          amount: reports.financials.totalBenefits,
          type: "expense" as const,
        },
        {
          id: "total-expenses",
          name: "Total Expenses",
          amount: reports.financials.totalExpenses,
          type: "total" as const,
        },
        {
          id: "net-income",
          name: "Net Income",
          amount: reports.financials.netIncome,
          type: "total" as const,
        },
      ],
    };
  }, [reports]);

  const hiringData = React.useMemo(() => {
    if (!reports?.hiringOutcomes) return undefined;
    return {
      newReps: reports.hiringOutcomes.newRepOutcomes.map((outcome) => ({
        id: outcome.repId,
        name: `Rep ${outcome.repId}`,
        status: outcome.outcome as "hired" | "not_hired",
        quarter: selectedQuarter,
      })),
      oldReps: reports.hiringOutcomes.oldRepOutcomes.map((outcome) => ({
        id: outcome.repId,
        name: `Rep ${outcome.repId}`,
        status: outcome.outcome as "retained" | "poached",
      })),
    };
  }, [reports, selectedQuarter]);

  const performanceData = React.useMemo(() => {
    if (!reports?.repPerformance) return undefined;
    return reports.repPerformance.map((rep) => ({
      id: rep.repId,
      name: rep.name,
      sales: rep.sales,
      margin: rep.contributionMargin,
      growth: 0, // Will be calculated from previous quarter data
      satisfaction: 4.0, // Will be added when customer satisfaction is implemented
    }));
  }, [reports]);

  // Render appropriate report based on type
  const renderReport = () => {
    // Show loading state
    if (!reports) {
      return <ReportCard isLoading={true}>{null}</ReportCard>;
    }

    // Show no data message if no reports exist
    if (!reports.financials && !reports.hiringOutcomes && (!reports.repPerformance || reports.repPerformance.length === 0)) {
      return <NoReports quarter={quarterNumber} />;
    }

    switch (reportType) {
      case "financial":
        return (
          <FinancialReport
            data={financialData}
            isLoading={false}
            error={null}
          />
        );

      case "hiring":
        return (
          <HiringOutcomeReport
            data={hiringData}
            isLoading={false}
            error={null}
          />
        );

      case "performance":
        return (
          <RepPerformanceReport
            data={performanceData}
            isLoading={false}
            error={null}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Performance Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your company's financial, hiring, and performance reports
          </p>
        </div>

        {/* Report Navigation */}
        <ReportNavigation
          currentQuarter={selectedQuarter}
          onQuarterChange={setSelectedQuarter}
          reportType={reportType}
          onReportTypeChange={setReportType}
          availableQuarters={availableQuarters}
          showCompanySelector={false}
          userRole="rep"
        />

        {/* Report Content */}
        {renderReport()}
      </div>
    </div>
  );
}

/**
 * Route definition using TanStack Router file-based routing
 *
 * Route: /student/reports
 * Access: Students only
 * Component: StudentReportsPage
 */
export const Route = createFileRoute("/student/reports")({
  component: StudentReportsPage,

  // Before load: Check authentication
  beforeLoad: async ({ location, context }) => {
    // Client-side auth check will happen in component
    return {};
  },

  // Loader: Preload data if needed
  loader: async ({ context }) => {
    // Data is loaded via React Query in component
    return {};
  },
});

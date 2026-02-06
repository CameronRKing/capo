/**
 * Teacher Reports Page - /teacher/reports
 *
 * Provides teachers with access to all company reports in their game:
 * - Financial reports (sales, margin, net income)
 * - Hiring outcome reports (new hires, retained, poached reps)
 * - Representative performance reports (sales, growth, satisfaction)
 *
 * Features:
 * - Company selector to view specific company or "All Companies"
 * - Quarter navigation to view historical reports
 * - Report type tabs (Financial, Hiring, Performance)
 * - Dark mode support
 * - Responsive layout
 *
 * Access Control:
 * - Only accessible by authenticated teachers and admins
 * - Teachers see all companies in their game
 * - Data is filtered by RLS queries
 *
 * @route /teacher/reports
 */

import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ReportNavigation, ReportType } from "@/components/reports/ReportNavigation";
import { ReportCard } from "@/components/reports/ReportCard";
import { FinancialReport } from "@/components/reports/FinancialReport";
import { HiringOutcomeReport } from "@/components/reports/HiringOutcomeReport";
import { RepPerformanceReport } from "@/components/reports/RepPerformanceReport";
import { ErrorPage } from "@/components/ErrorPage";

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
function NoReports({ quarter, company }: { quarter: number; company?: string }) {
  const message = company
    ? `Reports for ${company} in Quarter ${quarter} are not yet available.`
    : `Reports for Quarter ${quarter} are not yet available.`;

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
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

/**
 * Aggregated Reports View for "All Companies"
 */
function AggregatedReportsView({
  gameReports,
  reportType,
  quarter,
}: {
  gameReports: Array<{
    company: { _id: Id<"companies">; name: string; industry?: string };
    reports: {
      hiringOutcomes?: unknown;
      financials?: unknown;
      repPerformance?: unknown[];
    };
  }>;
  reportType: ReportType;
  quarter: number;
}) {
  // Filter companies that have reports for this type
  const companiesWithReports = React.useMemo(() => {
    return gameReports.filter((item) => {
      switch (reportType) {
        case "financial":
          return item.reports.financials !== undefined;
        case "hiring":
          return item.reports.hiringOutcomes !== undefined;
        case "performance":
          return item.reports.repPerformance && item.reports.repPerformance.length > 0;
        default:
          return false;
      }
    });
  }, [gameReports, reportType]);

  if (companiesWithReports.length === 0) {
    return <NoReports quarter={quarter} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Showing reports for {companiesWithReports.length} company/companies
        </p>
      </div>

      {companiesWithReports.map((item) => (
        <div key={item.company._id} className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {item.company.name}
            {item.company.industry && (
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                ({item.company.industry})
              </span>
            )}
          </h3>

          {reportType === "financial" && item.reports.financials && (
            <FinancialReport
              data={
                // @ts-ignore - Transform financial data
                {
                  summary: {
                    sales: item.reports.financials.totalSales,
                    grossMargin: item.reports.financials.grossMargin,
                    netIncome: item.reports.financials.netIncome,
                  },
                  lineItems: [
                    {
                      id: "sales",
                      name: "Total Sales",
                      amount: item.reports.financials.totalSales,
                      type: "revenue" as const,
                    },
                    {
                      id: "gross-margin",
                      name: "Gross Margin",
                      amount: item.reports.financials.grossMargin,
                      type: "subtotal" as const,
                    },
                    {
                      id: "total-expenses",
                      name: "Total Expenses",
                      amount: item.reports.financials.totalExpenses,
                      type: "total" as const,
                    },
                    {
                      id: "net-income",
                      name: "Net Income",
                      amount: item.reports.financials.netIncome,
                      type: "total" as const,
                    },
                  ],
                }
              }
              isLoading={false}
              error={null}
            />
          )}

          {reportType === "hiring" && item.reports.hiringOutcomes && (
            <HiringOutcomeReport
              data={
                // @ts-ignore - Transform hiring data
                {
                  newReps: item.reports.hiringOutcomes.newRepOutcomes.map((outcome: unknown) => ({
                    // @ts-ignore
                    id: outcome.repId,
                    // @ts-ignore
                    name: `Rep ${outcome.repId}`,
                    // @ts-ignore
                    status: outcome.outcome,
                    quarter: `Q${quarter}`,
                  })),
                  oldReps: item.reports.hiringOutcomes.oldRepOutcomes.map((outcome: unknown) => ({
                    // @ts-ignore
                    id: outcome.repId,
                    // @ts-ignore
                    name: `Rep ${outcome.repId}`,
                    // @ts-ignore
                    status: outcome.outcome,
                  })),
                }
              }
              isLoading={false}
              error={null}
            />
          )}

          {reportType === "performance" && item.reports.repPerformance && item.reports.repPerformance.length > 0 && (
            <RepPerformanceReport
              data={
                // @ts-ignore - Transform performance data
                item.reports.repPerformance.map((rep: unknown) => ({
                  // @ts-ignore
                  id: rep.repId,
                  // @ts-ignore
                  name: rep.name,
                  // @ts-ignore
                  sales: rep.sales,
                  // @ts-ignore
                  margin: rep.contributionMargin,
                  growth: 0,
                  satisfaction: 4.0,
                }))
              }
              isLoading={false}
              error={null}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * TeacherReportsPage Component
 *
 * Main reports page for teachers with navigation and report display.
 */
function TeacherReportsPage() {
  const user = useCurrentUser();
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [reportType, setReportType] = useState<ReportType>("financial");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Access control checks
  if (!user) {
    return <LoadingState />;
  }

  if (user.role !== "teacher" && user.role !== "admin") {
    return <AccessDenied message="This page is only accessible to teachers and administrators." />;
  }

  if (!user.gameId) {
    return <AccessDenied message="You must be assigned to a game before viewing reports." />;
  }

  // Load game data to get available quarters and companies
  const game = useQuery(api.games.getGame, { gameId: user.gameId });

  // Load companies in the game
  const companies = useQuery(
    api.companies.listByGame,
    user.gameId ? { gameId: user.gameId } : "skip"
  );

  // Parse quarter number from selection (e.g., "Q1" -> 1)
  const quarterNumber = parseInt(selectedQuarter.replace("Q", ""), 10);

  // Determine if we're viewing "All Companies" or a specific company
  const viewingAllCompanies = !selectedCompanyId;

  // Load reports based on selection
  const reportsData = useQuery(
    viewingAllCompanies
      ? api.reports.getReportsByGame
      : api.reports.getReportsByCompany,
    viewingAllCompanies
      ? { gameId: user.gameId, quarter: quarterNumber }
      : selectedCompanyId
      ? { companyId: selectedCompanyId as Id<"companies">, quarter: quarterNumber }
      : "skip"
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

  // Transform company data for selector
  const companyOptions = React.useMemo(() => {
    if (!companies) return [];
    return companies.map((company) => ({
      id: company._id,
      name: company.name,
    }));
  }, [companies]);

  // Transform report data for single company view
  const financialData = React.useMemo(() => {
    if (viewingAllCompanies || !reportsData?.financials) return undefined;
    return {
      summary: {
        sales: reportsData.financials.totalSales,
        grossMargin: reportsData.financials.grossMargin,
        netIncome: reportsData.financials.netIncome,
      },
      lineItems: [
        {
          id: "sales",
          name: "Total Sales",
          amount: reportsData.financials.totalSales,
          type: "revenue" as const,
        },
        {
          id: "gross-margin",
          name: "Gross Margin",
          amount: reportsData.financials.grossMargin,
          type: "subtotal" as const,
        },
        {
          id: "rep-salaries",
          name: "Sales Rep Salaries",
          amount: reportsData.financials.totalRepSalaries,
          type: "expense" as const,
        },
        {
          id: "commissions",
          name: "Commissions",
          amount: reportsData.financials.totalCommissions,
          type: "expense" as const,
        },
        {
          id: "benefits",
          name: "Benefits",
          amount: reportsData.financials.totalBenefits,
          type: "expense" as const,
        },
        {
          id: "total-expenses",
          name: "Total Expenses",
          amount: reportsData.financials.totalExpenses,
          type: "total" as const,
        },
        {
          id: "net-income",
          name: "Net Income",
          amount: reportsData.financials.netIncome,
          type: "total" as const,
        },
      ],
    };
  }, [reportsData, viewingAllCompanies]);

  const hiringData = React.useMemo(() => {
    if (viewingAllCompanies || !reportsData?.hiringOutcomes) return undefined;
    return {
      newReps: reportsData.hiringOutcomes.newRepOutcomes.map((outcome) => ({
        id: outcome.repId,
        name: `Rep ${outcome.repId}`,
        status: outcome.outcome as "hired" | "not_hired",
        quarter: selectedQuarter,
      })),
      oldReps: reportsData.hiringOutcomes.oldRepOutcomes.map((outcome) => ({
        id: outcome.repId,
        name: `Rep ${outcome.repId}`,
        status: outcome.outcome as "retained" | "poached",
      })),
    };
  }, [reportsData, selectedQuarter, viewingAllCompanies]);

  const performanceData = React.useMemo(() => {
    if (viewingAllCompanies || !reportsData?.repPerformance) return undefined;
    return reportsData.repPerformance.map((rep) => ({
      id: rep.repId,
      name: rep.name,
      sales: rep.sales,
      margin: rep.contributionMargin,
      growth: 0, // Will be calculated from previous quarter data
      satisfaction: 4.0, // Will be added when customer satisfaction is implemented
    }));
  }, [reportsData, viewingAllCompanies]);

  // Render appropriate report based on type
  const renderReport = () => {
    // Show loading state
    if (!reportsData) {
      return <ReportCard isLoading={true}>{null}</ReportCard>;
    }

    // Show "All Companies" aggregated view
    if (viewingAllCompanies) {
      return <AggregatedReportsView gameReports={reportsData} reportType={reportType} quarter={quarterNumber} />;
    }

    // Show no data message if no reports exist for single company
    if (!reportsData.financials && !reportsData.hiringOutcomes && (!reportsData.repPerformance || reportsData.repPerformance.length === 0)) {
      const selectedCompany = companyOptions.find((c) => c.id === selectedCompanyId);
      return <NoReports quarter={quarterNumber} company={selectedCompany?.name} />;
    }

    // Show single company report
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
            Company Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View financial, hiring, and performance reports for all companies
          </p>
        </div>

        {/* Report Navigation */}
        <ReportNavigation
          currentQuarter={selectedQuarter}
          onQuarterChange={setSelectedQuarter}
          reportType={reportType}
          onReportTypeChange={setReportType}
          availableQuarters={availableQuarters}
          showCompanySelector={true}
          selectedCompany={selectedCompanyId}
          onCompanyChange={setSelectedCompanyId}
          companies={companyOptions}
          userRole="teacher"
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
 * Route: /teacher/reports
 * Access: Teachers and admins only
 * Component: TeacherReportsPage
 */
export const Route = createFileRoute("/teacher/reports")({
  component: TeacherReportsPage,
  errorComponent: ({ error }) => <ErrorPage error={error} />,

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

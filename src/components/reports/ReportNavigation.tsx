import { useState } from "react";

export type ReportType = "financial" | "hiring" | "performance";

interface ReportNavigationProps {
  currentQuarter: string;
  onQuarterChange: (quarter: string) => void;
  reportType: ReportType;
  onReportTypeChange: (type: ReportType) => void;
  availableQuarters: string[];
  showCompanySelector?: boolean;
  selectedCompany?: string;
  onCompanyChange?: (companyId: string) => void;
  companies?: Array<{ id: string; name: string }>;
  userRole?: "teacher" | "admin" | "rep";
}

export function ReportNavigation({
  currentQuarter,
  onQuarterChange,
  reportType,
  onReportTypeChange,
  availableQuarters,
  showCompanySelector = false,
  selectedCompany,
  onCompanyChange,
  companies = [],
  userRole = "rep",
}: ReportNavigationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const reportTypes: Array<{ value: ReportType; label: string }> = [
    { value: "financial", label: "Financial" },
    { value: "hiring", label: "Hiring Outcomes" },
    { value: "performance", label: "Rep Performance" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Report Type Tabs */}
        <div className="flex flex-wrap gap-2">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onReportTypeChange(type.value)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                reportType === type.value
                  ? "bg-blue-600 text-white dark:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Quarter Selector */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quarter
            </label>
            <select
              value={currentQuarter}
              onChange={(e) => onQuarterChange(e.target.value)}
              className="block w-40 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 sm:text-sm px-3 py-2 border"
            >
              {availableQuarters.map((quarter) => (
                <option key={quarter} value={quarter}>
                  {quarter}
                </option>
              ))}
            </select>
          </div>

          {/* Company Selector (Teachers Only) */}
          {showCompanySelector && userRole === "teacher" && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <select
                value={selectedCompany || ""}
                onChange={(e) => onCompanyChange?.(e.target.value)}
                className="block w-48 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 sm:text-sm px-3 py-2 border"
              >
                <option value="">All Companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

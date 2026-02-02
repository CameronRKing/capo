import { useState } from "react";
import { ReportCard } from "./ReportCard";

type SortField = "name" | "sales" | "margin" | "growth" | "satisfaction";
type SortOrder = "asc" | "desc";

interface RepPerformanceData {
  id: string;
  name: string;
  sales: number;
  margin: number;
  growth: number;
  satisfaction: number;
}

interface RepPerformanceReportProps {
  data?: RepPerformanceData[];
  isLoading?: boolean;
  error?: Error | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function RepPerformanceReport({
  data,
  isLoading = false,
  error = null,
}: RepPerformanceReportProps) {
  const [sortField, setSortField] = useState<SortField>("sales");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedData = data
    ? [...data].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === "asc" ? comparison : -comparison;
      })
    : [];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getGrowthColor = (value: number) => {
    if (value >= 10) return "text-green-600 dark:text-green-400";
    if (value >= 0) return "text-gray-600 dark:text-gray-400";
    return "text-red-600 dark:text-red-400";
  };

  const getSatisfactionColor = (value: number) => {
    if (value >= 4.5) return "text-green-600 dark:text-green-400";
    if (value >= 4.0) return "text-blue-600 dark:text-blue-400";
    if (value >= 3.5) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <ReportCard data={data} isLoading={isLoading} error={error} title="Rep Performance">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Representative Performance Report
        </h2>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort("name")}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
                  >
                    Name
                    <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort("sales")}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-end"
                  >
                    Sales
                    <SortIcon field="sales" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort("margin")}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-end"
                  >
                    Margin
                    <SortIcon field="margin" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort("growth")}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-end"
                  >
                    Growth
                    <SortIcon field="growth" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort("satisfaction")}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-end"
                  >
                    Satisfaction
                    <SortIcon field="satisfaction" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedData.map((rep) => (
                <tr key={rep.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {rep.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(rep.sales)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(rep.margin)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right ${getGrowthColor(rep.growth)}`}>
                    {formatPercentage(rep.growth)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right ${getSatisfactionColor(rep.satisfaction)}`}>
                    {rep.satisfaction.toFixed(1)} / 5.0
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Grid */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {sortedData.map((rep) => (
            <div
              key={rep.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {rep.name}
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sales</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(rep.sales)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Margin</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(rep.margin)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Growth</span>
                  <span className={`text-sm font-medium ${getGrowthColor(rep.growth)}`}>
                    {formatPercentage(rep.growth)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Satisfaction</span>
                  <span className={`text-sm font-medium ${getSatisfactionColor(rep.satisfaction)}`}>
                    {rep.satisfaction.toFixed(1)} / 5.0
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data ? data.filter((r) => r.growth >= 10).length : 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">High Growth</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data ? data.filter((r) => r.satisfaction >= 4.5).length : 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Top Rated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data
                ? data.reduce((sum, r) => sum + r.sales, 0) > 0
                  ? formatCurrency(data.reduce((sum, r) => sum + r.sales, 0))
                  : "---"
                : "---"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Sales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {data
                ? data.length > 0
                  ? (data.reduce((sum, r) => sum + r.satisfaction, 0) / data.length).toFixed(1)
                  : "---"
                : "---"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Satisfaction</div>
          </div>
        </div>
      </div>
    </ReportCard>
  );
}

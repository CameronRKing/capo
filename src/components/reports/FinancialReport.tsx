import { ReportCard } from "./ReportCard";

interface FinancialSummary {
  sales: number;
  grossMargin: number;
  netIncome: number;
}

interface FinancialLineItem {
  id: string;
  name: string;
  amount: number;
  type: "revenue" | "expense" | "subtotal" | "total";
  level?: number;
  children?: FinancialLineItem[];
}

interface FinancialReportProps {
  data?: {
    summary: FinancialSummary;
    lineItems: FinancialLineItem[];
  };
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

function getLineItemStyle(type: FinancialLineItem["type"], level: number = 0) {
  const basePadding = level * 16;

  switch (type) {
    case "revenue":
      return {
        bgColor: "bg-green-50 dark:bg-green-900/20",
        textColor: "text-green-900 dark:text-green-200",
        font: "font-medium",
        padding: basePadding,
      };
    case "expense":
      return {
        bgColor: "bg-red-50 dark:bg-red-900/20",
        textColor: "text-red-900 dark:text-red-200",
        font: "font-medium",
        padding: basePadding,
      };
    case "subtotal":
      return {
        bgColor: "bg-gray-100 dark:bg-gray-700",
        textColor: "text-gray-900 dark:text-gray-200",
        font: "font-semibold",
        padding: basePadding + 8,
      };
    case "total":
      return {
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        textColor: "text-blue-900 dark:text-blue-200",
        font: "font-bold",
        padding: basePadding + 8,
      };
    default:
      return {
        bgColor: "",
        textColor: "text-gray-900 dark:text-gray-200",
        font: "",
        padding: basePadding,
      };
  }
}

export function FinancialReport({
  data,
  isLoading = false,
  error = null,
}: FinancialReportProps) {
  return (
    <ReportCard data={data} isLoading={isLoading} error={error} title="Financial Report">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Financial Report
        </h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
              Total Sales
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-200">
              {data ? formatCurrency(data.summary.sales) : "---"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
              Gross Margin
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
              {data ? formatCurrency(data.summary.grossMargin) : "---"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
              Net Income
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">
              {data ? formatCurrency(data.summary.netIncome) : "---"}
            </div>
          </div>
        </div>

        {/* Hierarchical Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Line Item
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data?.lineItems.map((item) => {
                const style = getLineItemStyle(item.type, item.level);
                return (
                  <tr key={item.id} className={style.bgColor}>
                    <td
                      className={`px-4 py-3 ${style.textColor} ${style.font}`}
                      style={{ paddingLeft: `${16 + style.padding}px` }}
                    >
                      {item.name}
                    </td>
                    <td className={`px-4 py-3 text-right ${style.textColor} ${style.font}`}>
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Profitability Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Gross Margin %
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {data
                ? ((data.summary.grossMargin / data.summary.sales) * 100).toFixed(1)
                : "---"}
              %
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Net Profit Margin %
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {data
                ? ((data.summary.netIncome / data.summary.sales) * 100).toFixed(1)
                : "---"}
              %
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Overhead Ratio
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {data
                ? (
                    ((data.summary.sales - data.summary.grossMargin) /
                      data.summary.sales) *
                    100
                  ).toFixed(1)
                : "---"}
              %
            </div>
          </div>
        </div>
      </div>
    </ReportCard>
  );
}

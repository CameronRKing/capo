import { ReportCard } from "./ReportCard";

type HiringStatus = "retained" | "poached" | "hired" | "not_hired";

interface RepData {
  id: string;
  name: string;
  status: HiringStatus;
  quarter?: string;
}

interface HiringOutcomeReportProps {
  data?: {
    newReps: RepData[];
    oldReps: RepData[];
  };
  isLoading?: boolean;
  error?: Error | null;
}

const statusConfig: Record<
  HiringStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  retained: {
    label: "Retained",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-800 dark:text-green-300",
  },
  poached: {
    label: "Poached",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-800 dark:text-red-300",
  },
  hired: {
    label: "Hired",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-800 dark:text-blue-300",
  },
  not_hired: {
    label: "Not Hired",
    bgColor: "bg-gray-100 dark:bg-gray-700",
    textColor: "text-gray-800 dark:text-gray-300",
  },
};

export function HiringOutcomeReport({
  data,
  isLoading = false,
  error = null,
}: HiringOutcomeReportProps) {
  return (
    <ReportCard data={data} isLoading={isLoading} error={error} title="Hiring Outcomes">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Hiring Outcomes Report
        </h2>

        {/* New Reps Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            New Hires This Quarter
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.newReps.map((rep) => {
              const config = statusConfig[rep.status];
              return (
                <div
                  key={rep.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {rep.name}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.textColor}`}
                    >
                      {config.label}
                    </span>
                  </div>
                  {rep.quarter && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Hired: {rep.quarter}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Old Reps Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            Previous Reps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.oldReps.map((rep) => {
              const config = statusConfig[rep.status];
              return (
                <div
                  key={rep.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {rep.name}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.textColor}`}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data?.newReps.filter((r) => r.status === "hired").length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">New Hires</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data?.oldReps.filter((r) => r.status === "retained").length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Retained</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {data?.oldReps.filter((r) => r.status === "poached").length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Poached</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {data?.newReps.filter((r) => r.status === "not_hired").length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Declined</div>
            </div>
          </div>
        </div>
      </div>
    </ReportCard>
  );
}

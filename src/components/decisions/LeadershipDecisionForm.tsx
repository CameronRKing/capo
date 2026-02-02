/**
 * LeadershipDecisionForm Component
 *
 * Form for leadership phase decisions including:
 * - Time allocation (must sum to 100%)
 * - Per-rep management (individual hours + leadership behavior)
 * - Territory assignments (embedded TerritoryMap)
 * - Market reports (checkboxes)
 *
 * Features:
 * - Auto-save on every change (debounced 500ms)
 * - Real-time validation (sum to 100%)
 * - Presence indicators (online teammates)
 * - Focus indicators (who's editing what)
 * - Submit confirmation
 * - Last submitted info display
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { usePresence } from "../../hooks/usePresence";
import { useFocus } from "../../hooks/useFocus";
import { CompanyPresenceHeader } from "../collaboration/CompanyPresenceHeader";
import { TerritoryMap } from "./TerritoryMap";

// Leadership behavior options
const LEADERSHIP_BEHAVIORS = [
  "Directive - Clear instructions and close supervision",
  "Supportive - Encouraging and approachable",
  "Achievement-Oriented - Challenging goals and high expectations",
  "Participative - Consultative and team-focused",
  "Coaching - Developing skills and capabilities",
  "Delegating - Assigning responsibility and autonomy",
];

// Individual hours options
const INDIVIDUAL_HOURS_OPTIONS = [
  { value: 1, label: "0-1 hours" },
  { value: 2, label: "1-2 hours" },
  { value: 3, label: "2+ hours" },
];

interface RepSettings {
  repId: Id<"activeReps">;
  individualHours: number;
  leadershipBehavior: string;
}

interface LeadershipDecisionFormData {
  timeRecruiting: number;
  timeMeetingCustomers: number;
  timeSalesPlanning: number;
  timeAdministrativePaperwork: number;
  buyTerritoryReport: boolean;
  buyCompensationReport: boolean;
  buyPerformanceReport: boolean;
}

interface LeadershipDecisionFormProps {
  companyId: Id<"companies">;
  quarter: number;
  user: {
    _id: Id<"users">;
    name: string;
    email: string;
  };
}

export function LeadershipDecisionForm({
  companyId,
  quarter,
  user,
}: LeadershipDecisionFormProps) {
  // Load working decision
  const workingDecision = useQuery(api.domain.decisions.getLeadershipDecisionWorking, {
    companyId,
    quarter,
  });

  // Load active reps for this quarter
  const reps = useQuery(api.activeReps.listByCompanyQuarter, {
    companyId,
    quarter,
  });

  // Mutations
  const saveWorking = useMutation(api.domain.decisions.saveLeadershipDecisionWorking);
  const submitDecision = useMutation(api.domain.decisions.submitLeadershipDecision);

  // Presence and focus
  const { onlineUsers, getUserColor } = usePresence(companyId);
  const timeRecruitingFocus = useFocus(companyId, "leadership", "timeRecruiting", user._id);
  const timeMeetingCustomersFocus = useFocus(
    companyId,
    "leadership",
    "timeMeetingCustomers",
    user._id
  );
  const timeSalesPlanningFocus = useFocus(
    companyId,
    "leadership",
    "timeSalesPlanning",
    user._id
  );
  const timeAdministrativePaperworkFocus = useFocus(
    companyId,
    "leadership",
    "timeAdministrativePaperwork",
    user._id
  );

  // Form state
  const [formData, setFormData] = useState<LeadershipDecisionFormData>({
    timeRecruiting: 0,
    timeMeetingCustomers: 0,
    timeSalesPlanning: 0,
    timeAdministrativePaperwork: 0,
    buyTerritoryReport: false,
    buyCompensationReport: false,
    buyPerformanceReport: false,
  });

  const [repSettings, setRepSettings] = useState<RepSettings[]>([]);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedBy, setSubmittedBy] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Initialize form from working decision
  useEffect(() => {
    if (workingDecision) {
      setFormData({
        timeRecruiting: workingDecision.timeRecruiting,
        timeMeetingCustomers: workingDecision.timeMeetingCustomers,
        timeSalesPlanning: workingDecision.timeSalesPlanning,
        timeAdministrativePaperwork: workingDecision.timeAdministrativePaperwork,
        buyTerritoryReport: workingDecision.buyTerritoryReport,
        buyCompensationReport: workingDecision.buyCompensationReport,
        buyPerformanceReport: workingDecision.buyPerformanceReport,
      });
      setIsSubmitted(workingDecision.isSubmitted);
      setSubmittedBy(workingDecision.submittedBy ?? null);
      setSubmittedAt(workingDecision.submittedAt ?? null);
    }
  }, [workingDecision]);

  // Initialize rep settings from reps
  useEffect(() => {
    if (reps) {
      setRepSettings(
        reps.map((rep) => ({
          repId: rep._id,
          individualHours: rep.individualHours || 1,
          leadershipBehavior: rep.leadershipBehavior || LEADERSHIP_BEHAVIORS[0],
        }))
      );
    }
  }, [reps]);

  // Debounced auto-save
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (saveStatus === "saving") {
        try {
          await saveWorking({
            companyId,
            quarter,
            data: formData,
          });
          setSaveStatus("saved");
          // Clear "saved" status after 2 seconds
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
          console.error("Auto-save failed:", error);
          setSaveStatus("error");
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData, companyId, quarter, saveWorking, saveStatus]);

  // Handle form change
  const handleFormChange = useCallback(
    (field: keyof LeadershipDecisionFormData, value: number | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setSaveStatus("saving");
    },
    []
  );

  // Calculate time allocation sum
  const timeSum =
    formData.timeRecruiting +
    formData.timeMeetingCustomers +
    formData.timeSalesPlanning +
    formData.timeAdministrativePaperwork;

  const isValid = timeSum === 100;

  // Calculate market reports cost
  const reportsCost =
    (formData.buyTerritoryReport ? 10000 : 0) +
    (formData.buyCompensationReport ? 10000 : 0) +
    (formData.buyPerformanceReport ? 10000 : 0);

  // Handle rep settings change
  const handleRepSettingsChange = useCallback(
    (repId: Id<"activeReps">, field: keyof RepSettings, value: string | number) => {
      setRepSettings((prev) =>
        prev.map((settings) =>
          settings.repId === repId ? { ...settings, [field]: value } : settings
        )
      );
      setSaveStatus("saving");
    },
    []
  );

  // Handle submit
  const handleSubmit = async () => {
    try {
      await submitDecision({ companyId, quarter });
      setIsSubmitted(true);
      setSubmittedBy(user.name);
      setSubmittedAt(Date.now());
      setShowSubmitConfirm(false);
    } catch (error) {
      console.error("Submit failed:", error);
      alert("Submission failed. Please check your data and try again.");
    }
  };

  if (!reps) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Presence Header */}
      <CompanyPresenceHeader
        companyId={companyId}
        companyName={`Company ${companyId}`}
        showOfflineTooltip={false}
        className="mb-6"
      />

      {/* Auto-save indicator */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        {saveStatus === "saving" && (
          <span className="text-blue-600">Saving...</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-green-600">✓ Saved</span>
        )}
        {saveStatus === "error" && (
          <span className="text-red-600">✗ Save failed</span>
        )}
      </div>

      {/* Submitted info */}
      {isSubmitted && submittedAt && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800">
            ✓ Last submitted by {submittedBy} at {new Date(submittedAt).toLocaleString()}
          </p>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Time Allocation Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Time Allocation</h2>
          <p className="text-sm text-gray-600 mb-4">
            Allocate your time across activities (must sum to 100%)
          </p>

          <div className="space-y-4">
            {/* Recruiting */}
            <FocusAwareSlider
              label="Recruiting"
              value={formData.timeRecruiting}
              onChange={(value) => handleFormChange("timeRecruiting", value)}
              onFocus={timeRecruitingFocus.updateFocus}
              onBlur={timeRecruitingFocus.clearFocus}
              focusedUsers={timeRecruitingFocus.focusedUsers}
              getUserColor={getUserColor}
              min={5}
              max={100}
            />

            {/* Meeting Customers */}
            <FocusAwareSlider
              label="Meeting Customers"
              value={formData.timeMeetingCustomers}
              onChange={(value) => handleFormChange("timeMeetingCustomers", value)}
              onFocus={timeMeetingCustomersFocus.updateFocus}
              onBlur={timeMeetingCustomersFocus.clearFocus}
              focusedUsers={timeMeetingCustomersFocus.focusedUsers}
              getUserColor={getUserColor}
              min={5}
              max={100}
            />

            {/* Sales Planning */}
            <FocusAwareSlider
              label="Sales Planning"
              value={formData.timeSalesPlanning}
              onChange={(value) => handleFormChange("timeSalesPlanning", value)}
              onFocus={timeSalesPlanningFocus.updateFocus}
              onBlur={timeSalesPlanningFocus.clearFocus}
              focusedUsers={timeSalesPlanningFocus.focusedUsers}
              getUserColor={getUserColor}
              min={5}
              max={100}
            />

            {/* Administrative Paperwork */}
            <FocusAwareSlider
              label="Administrative Paperwork"
              value={formData.timeAdministrativePaperwork}
              onChange={(value) => handleFormChange("timeAdministrativePaperwork", value)}
              onFocus={timeAdministrativePaperworkFocus.updateFocus}
              onBlur={timeAdministrativePaperworkFocus.clearFocus}
              focusedUsers={timeAdministrativePaperworkFocus.focusedUsers}
              getUserColor={getUserColor}
              min={0}
              max={100}
            />
          </div>

          {/* Sum validation */}
          <div className="mt-4 p-3 rounded border">
            <p className="text-sm font-semibold">Total: {timeSum}%</p>
            {!isValid && (
              <p className="text-sm text-red-600">
                Time allocation must sum to 100% (currently {timeSum}%)
              </p>
            )}
            {isValid && (
              <p className="text-sm text-green-600">✓ Time allocation is valid</p>
            )}
          </div>
        </section>

        {/* Per-Rep Management Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Individual Rep Management</h2>
          <p className="text-sm text-gray-600 mb-4">
            Set individual supervision hours and leadership behavior for each rep
          </p>

          <div className="space-y-4">
            {reps.map((rep) => {
              const settings = repSettings.find((s) => s.repId === rep._id);
              if (!settings) return null;

              return (
                <RepSettingsCard
                  key={rep._id}
                  rep={rep}
                  settings={settings}
                  onHoursChange={(value) =>
                    handleRepSettingsChange(rep._id, "individualHours", value)
                  }
                  onBehaviorChange={(value) =>
                    handleRepSettingsChange(rep._id, "leadershipBehavior", value)
                  }
                  companyId={companyId}
                  user={user}
                  getUserColor={getUserColor}
                />
              );
            })}
          </div>
        </section>

        {/* Territory Assignments Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Territory Assignments</h2>
          <p className="text-sm text-gray-600 mb-4">
            Assign counties to sales reps. All counties must be assigned and each rep's
            territory must be contiguous.
          </p>

          <TerritoryMap companyId={companyId} quarter={quarter} reps={reps} />
        </section>

        {/* Market Reports Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Market Reports</h2>
          <p className="text-sm text-gray-600 mb-4">
            Purchase market reports for $10,000 each
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.buyTerritoryReport}
                onChange={(e) => handleFormChange("buyTerritoryReport", e.target.checked)}
                disabled={isSubmitted}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm">Territory Reports ($10,000)</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.buyCompensationReport}
                onChange={(e) => handleFormChange("buyCompensationReport", e.target.checked)}
                disabled={isSubmitted}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm">Compensation Reports ($10,000)</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.buyPerformanceReport}
                onChange={(e) => handleFormChange("buyPerformanceReport", e.target.checked)}
                disabled={isSubmitted}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm">Performance Reports ($10,000)</span>
            </label>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm font-semibold">Total Cost: ${reportsCost.toLocaleString()}</p>
          </div>
        </section>

        {/* Submit Button */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-6">
          <div>
            <p className="text-sm text-gray-600">
              Submit your leadership decisions for compilation.
            </p>
            {!isValid && (
              <p className="text-sm text-red-600 mt-1">
                Please fix validation errors before submitting.
              </p>
            )}
          </div>

          {!isSubmitted ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                disabled={!isValid}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit Decisions
              </button>
            </div>
          ) : (
            <div className="px-6 py-2 bg-green-100 text-green-800 rounded">
              ✓ Submitted
            </div>
          )}
        </div>
      </form>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold mb-4">Confirm Submission</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to submit your leadership decisions? After submission,
              you cannot make changes until the next quarter.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * FocusAwareSlider - Slider with focus indicators
 */
interface FocusAwareSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onFocus: () => void;
  onBlur: () => void;
  focusedUsers: Array<{ user: { _id: string; name: string }; timestamp: number }>;
  getUserColor: (userId: string) => string;
  min?: number;
  max?: number;
}

function FocusAwareSlider({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  focusedUsers,
  getUserColor,
  min = 0,
  max = 100,
}: FocusAwareSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-2">
          {focusedUsers.length > 0 && (
            <div className="flex -space-x-2">
              {focusedUsers.map((fu) => (
                <div
                  key={fu.user._id}
                  className="w-6 h-6 rounded-full border-2 border-white"
                  style={{ backgroundColor: getUserColor(fu.user._id) }}
                  title={fu.user.name}
                />
              ))}
            </div>
          )}
          <span className="text-sm font-semibold">{value}%</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full"
      />
    </div>
  );
}

/**
 * RepSettingsCard - Card for individual rep settings
 */
interface RepSettingsCardProps {
  rep: {
    _id: Id<"activeReps">;
    repId: string;
  };
  settings: RepSettings;
  onHoursChange: (value: number) => void;
  onBehaviorChange: (value: string) => void;
  companyId: Id<"companies">;
  user: { _id: Id<"users"> };
  getUserColor: (userId: string) => string;
}

function RepSettingsCard({
  rep,
  settings,
  onHoursChange,
  onBehaviorChange,
  companyId,
  user,
  getUserColor,
}: RepSettingsCardProps) {
  const hoursFocus = useFocus(companyId, "leadership", `hours_${rep._id}`, user._id);
  const behaviorFocus = useFocus(
    companyId,
    "leadership",
    `behavior_${rep._id}`,
    user._id
  );

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">{rep.repId}</h3>

      <div className="space-y-4">
        {/* Individual Hours */}
        <div>
          <label className="text-sm font-medium block mb-2">Individual Hours</label>
          <div className="flex gap-4">
            {INDIVIDUAL_HOURS_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`hours_${rep._id}`}
                  value={option.value}
                  checked={settings.individualHours === option.value}
                  onChange={() => onHoursChange(option.value)}
                  onFocus={hoursFocus.updateFocus}
                  onBlur={hoursFocus.clearFocus}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
          {hoursFocus.focusedUsers.length > 1 && (
            <div className="mt-1 flex -space-x-1">
              {hoursFocus.focusedUsers.map((fu) => (
                <div
                  key={fu.user._id}
                  className="w-4 h-4 rounded-full border border-white"
                  style={{ backgroundColor: getUserColor(fu.user._id) }}
                  title={fu.user.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Leadership Behavior */}
        <div>
          <label className="text-sm font-medium block mb-2">Leadership Behavior</label>
          <select
            value={settings.leadershipBehavior}
            onChange={(e) => onBehaviorChange(e.target.value)}
            onFocus={behaviorFocus.updateFocus}
            onBlur={behaviorFocus.clearFocus}
            className="w-full border rounded px-3 py-2"
          >
            {LEADERSHIP_BEHAVIORS.map((behavior) => (
              <option key={behavior} value={behavior}>
                {behavior}
              </option>
            ))}
          </select>
          {behaviorFocus.focusedUsers.length > 1 && (
            <div className="mt-1 flex -space-x-1">
              {behaviorFocus.focusedUsers.map((fu) => (
                <div
                  key={fu.user._id}
                  className="w-4 h-4 rounded-full border border-white"
                  style={{ backgroundColor: getUserColor(fu.user._id) }}
                  title={fu.user.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

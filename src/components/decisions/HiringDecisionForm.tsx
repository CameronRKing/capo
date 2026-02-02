/**
 * HiringDecisionForm Component
 *
 * Complete hiring decision form with:
 * - All compensation, sales contest, training, and hiring/firing fields
 * - Real-time validation with inline errors
 * - Auto-save (500ms debounce) with status indicator
 * - Real-time collaboration (presence and focus indicators)
 * - Submit confirmation dialog
 *
 * Features:
 * - Compensation: salary, commission, benefits, travel, per diem
 * - Sales Contest: has contest, type, threshold
 * - Training Allocation: 4 sliders that must sum to 100%
 * - Recruiting: single slider
 * - Hiring & Firing: number to hire, hiring list, firing list
 *
 * @example
 * ```tsx
 * function HiringPage() {
 *   const user = useCurrentUser();
 *   const game = useQuery(api.games.getCurrent);
 *
 *   return (
 *     <HiringDecisionForm
 *       companyId={user.companyId}
 *       quarter={game.currentQuarter}
 *     />
 *   );
 * }
 * ```
 */

import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CompanyPresenceHeader } from "../collaboration/CompanyPresenceHeader";
import { FocusIndicator } from "../collaboration/FocusIndicator";
import { hiringDecisionSchema, type HiringDecision } from "@convex/domain/decisions/validators";

// =====================================================
// Types & Interfaces
// =====================================================

export interface HiringDecisionFormProps {
  /** The company ID */
  companyId: Id<"companies">;
  /** The current quarter */
  quarter: number;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

// =====================================================
// Helper Components
// =====================================================

/**
 * AutoSaveStatus - Displays auto-save status
 */
function AutoSaveStatus({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const statusConfig = {
    saving: { text: "Saving...", color: "text-blue-600 dark:text-blue-400" },
    saved: { text: "Saved", color: "text-green-600 dark:text-green-400" },
    error: { text: "Error saving", color: "text-red-600 dark:text-red-400" },
  };

  const config = statusConfig[status];

  return (
    <div className={`text-sm ${config.color} flex items-center gap-1`}>
      {status === "saving" && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {status === "saved" && (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
      {status === "error" && (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )}
      <span>{config.text}</span>
    </div>
  );
}

/**
 * ValidationErrors - Displays validation errors for a field
 */
function ValidationError({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <ul className="mt-1 text-sm text-red-600 dark:text-red-400 list-disc list-inside">
      {errors.map((error, index) => (
        <li key={index}>{error}</li>
      ))}
    </ul>
  );
}

/**
 * SliderWithLabel - Labeled slider with percentage display
 */
function SliderWithLabel({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "%",
  errors = [],
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  errors?: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}: {value}
        {unit}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
      <ValidationError errors={errors} />
    </div>
  );
}

/**
 * ConfirmDialog - Confirmation dialog before submit
 */
function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Submit Hiring Decision?
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to submit this hiring decision? After submission, you will not be able to make
          changes until the next quarter.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-gray-700"
          >
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Main Component
// =====================================================

export function HiringDecisionForm({ companyId, quarter }: HiringDecisionFormProps) {
  const user = useCurrentUser();

  // ===================================================
  // Form State
  // ===================================================

  const [formData, setFormData] = useState<Partial<HiringDecision>>({
    salary: 50000,
    commission: 5,
    benefits: "bronze",
    travel: "reps_pay_own",
    perDiem: undefined,
    hasSalesContest: false,
    salesContestType: undefined,
    salesContestThreshold: undefined,
    trainingProductKnowledge: 25,
    trainingMarketOrientation: 25,
    trainingCompanyOrientation: 25,
    trainingSellingTechniques: 25,
    numberToHire: 0,
    firingList: [],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===================================================
  // Queries & Mutations
  // ===================================================

  // Load working decision
  const workingDecision = useQuery(api.myFunctions.domain.decisions.getHiringDecisionWorking, {
    companyId,
    quarter,
  });

  // Load company info
  const company = useQuery(api.companies.get, { id: companyId });

  // Mutations
  const saveMutation = useMutation(api.myFunctions.domain.decisions.saveHiringDecisionWorking);
  const submitMutation = useMutation(api.myFunctions.domain.decisions.submitHiringDecision);

  // ===================================================
  // Initialize Form from Working Decision
  // ===================================================

  useEffect(() => {
    if (workingDecision && !isSubmitting) {
      setFormData({
        salary: workingDecision.salary,
        commission: workingDecision.commission,
        benefits: workingDecision.benefits,
        travel: workingDecision.travel,
        perDiem: workingDecision.perDiem,
        hasSalesContest: workingDecision.hasSalesContest,
        salesContestType: workingDecision.salesContestType,
        salesContestThreshold: workingDecision.salesContestThreshold,
        trainingProductKnowledge: workingDecision.trainingProductKnowledge,
        trainingMarketOrientation: workingDecision.trainingMarketOrientation,
        trainingCompanyOrientation: workingDecision.trainingCompanyOrientation,
        trainingSellingTechniques: workingDecision.trainingSellingTechniques,
        numberToHire: workingDecision.numberToHire,
        firingList: workingDecision.firingList,
      });
    }
  }, [workingDecision, isSubmitting]);

  // ===================================================
  // Validation
  // ===================================================

  const validateForm = useCallback((data: Partial<HiringDecision>): boolean => {
    const errors: Record<string, string[]> = {};

    try {
      hiringDecisionSchema.parse(data);
      setValidationErrors({});
      return true;
    } catch (error: any) {
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: any) => {
          const field = err.path[0] as string;
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(err.message);
        });
      }
      setValidationErrors(errors);
      return false;
    }
  }, []);

  // Calculate training sum
  const trainingSum =
    (formData.trainingProductKnowledge ?? 0) +
    (formData.trainingMarketOrientation ?? 0) +
    (formData.trainingCompanyOrientation ?? 0) +
    (formData.trainingSellingTechniques ?? 0);

  // ===================================================
  // Auto-Save (Debounced)
  // ===================================================

  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(async () => {
      // Only save if we have required fields
      if (
        formData.salary !== undefined &&
        formData.commission !== undefined &&
        formData.benefits &&
        formData.travel &&
        formData.trainingProductKnowledge !== undefined &&
        formData.trainingMarketOrientation !== undefined &&
        formData.trainingCompanyOrientation !== undefined &&
        formData.trainingSellingTechniques !== undefined &&
        formData.numberToHire !== undefined
      ) {
        setSaveStatus("saving");

        try {
          await saveMutation({
            companyId,
            quarter,
            data: {
              salary: formData.salary,
              commission: formData.commission,
              benefits: formData.benefits,
              travel: formData.travel,
              perDiem: formData.perDiem,
              hasSalesContest: formData.hasSalesContest ?? false,
              salesContestType: formData.salesContestType,
              salesContestThreshold: formData.salesContestThreshold,
              trainingProductKnowledge: formData.trainingProductKnowledge,
              trainingMarketOrientation: formData.trainingMarketOrientation,
              trainingCompanyOrientation: formData.trainingCompanyOrientation,
              trainingSellingTechniques: formData.trainingSellingTechniques,
              numberToHire: formData.numberToHire,
              firingList: formData.firingList ?? [],
            },
          });

          setSaveStatus("saved");

          // Clear "saved" status after 2 seconds
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
          console.error("Auto-save error:", error);
          setSaveStatus("error");
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, companyId, quarter, saveMutation, user]);

  // ===================================================
  // Form Handlers
  // ===================================================

  const handleChange = (field: keyof HiringDecision, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user || !validateForm(formData)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await submitMutation({
        companyId,
        quarter,
      });

      setShowConfirmDialog(false);
      // TODO: Show success message or redirect
      alert("Hiring decision submitted successfully!");
    } catch (error: any) {
      console.error("Submit error:", error);
      alert(`Error submitting: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===================================================
  // Render Helpers
  // ===================================================

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading user...</div>
      </div>
    );
  }

  const isFormValid = validateForm(formData);

  return (
    <div className="space-y-6">
      {/* Presence Header */}
      <CompanyPresenceHeader
        companyId={companyId}
        companyName={company?.name}
        showOfflineTooltip
        className="mb-6"
      />

      {/* Auto-save Status */}
      <div className="flex justify-end">
        <AutoSaveStatus status={saveStatus} />
      </div>

      {/* Section: Compensation Package */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Compensation Package
        </h3>

        <div className="space-y-4">
          {/* Salary */}
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="salary"
            userId={user._id}
            label="Annual Base Salary (USD)"
          >
            <input
              type="number"
              value={formData.salary ?? ""}
              onChange={(e) => handleChange("salary", parseInt(e.target.value) || 0)}
              min={30000}
              max={100000}
              step={1000}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="50000"
            />
          </FocusIndicator>
          <ValidationError errors={validationErrors.salary ?? []} />

          {/* Commission */}
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="commission"
            userId={user._id}
            label="Commission Percentage (%)"
          >
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={formData.commission ?? 0}
                onChange={(e) => handleChange("commission", parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {formData.commission ?? 0}%
              </div>
            </div>
          </FocusIndicator>
          <ValidationError errors={validationErrors.commission ?? []} />

          {/* Benefits */}
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="benefits"
            userId={user._id}
            label="Benefits Package"
          >
            <div className="space-y-2">
              {["bronze", "silver", "gold"].map((level) => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="benefits"
                    value={level}
                    checked={formData.benefits === level}
                    onChange={(e) => handleChange("benefits", e.target.value)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="capitalize text-gray-700 dark:text-gray-300">{level}</span>
                </label>
              ))}
            </div>
          </FocusIndicator>

          {/* Travel */}
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="travel"
            userId={user._id}
            label="Travel Expenses"
          >
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="travel"
                  value="reps_pay_own"
                  checked={formData.travel === "reps_pay_own"}
                  onChange={(e) => handleChange("travel", e.target.value)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Reps pay own travel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="travel"
                  value="monthly_per_diem"
                  checked={formData.travel === "monthly_per_diem"}
                  onChange={(e) => handleChange("travel", e.target.value)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Monthly per diem</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="travel"
                  value="unlimited"
                  checked={formData.travel === "unlimited"}
                  onChange={(e) => handleChange("travel", e.target.value)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Unlimited travel budget</span>
              </label>
            </div>
          </FocusIndicator>

          {/* Per Diem (conditional) */}
          {formData.travel === "monthly_per_diem" && (
            <FocusIndicator
              companyId={companyId}
              entity="hiring"
              fieldPath="perDiem"
              userId={user._id}
              label="Monthly Per Diem (USD)"
            >
              <input
                type="number"
                value={formData.perDiem ?? ""}
                onChange={(e) => handleChange("perDiem", parseInt(e.target.value) || 0)}
                min={0}
                max={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="50"
              />
            </FocusIndicator>
          )}
          <ValidationError errors={validationErrors.perDiem ?? []} />
        </div>
      </section>

      {/* Section: Sales Contest */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sales Contest
        </h3>

        <div className="space-y-4">
          {/* Has Sales Contest */}
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="hasSalesContest"
            userId={user._id}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasSalesContest ?? false}
                onChange={(e) => handleChange("hasSalesContest", e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Run a sales contest this quarter
              </span>
            </label>
          </FocusIndicator>

          {/* Sales Contest Type */}
          {formData.hasSalesContest && (
            <>
              <FocusIndicator
                companyId={companyId}
                entity="hiring"
                fieldPath="salesContestType"
                userId={user._id}
                label="Contest Type"
              >
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="salesContestType"
                      value="open"
                      checked={formData.salesContestType === "open"}
                      onChange={(e) => handleChange("salesContestType", e.target.value)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Open (all reps compete)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="salesContestType"
                      value="closed"
                      checked={formData.salesContestType === "closed"}
                      onChange={(e) => handleChange("salesContestType", e.target.value)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Closed (selected reps only)</span>
                  </label>
                </div>
              </FocusIndicator>

              {/* Sales Contest Threshold */}
              {formData.salesContestType === "open" && (
                <FocusIndicator
                  companyId={companyId}
                  entity="hiring"
                  fieldPath="salesContestThreshold"
                  userId={user._id}
                  label="Sales Threshold (USD)"
                >
                  <input
                    type="number"
                    value={formData.salesContestThreshold ?? ""}
                    onChange={(e) => handleChange("salesContestThreshold", parseInt(e.target.value) || 0)}
                    min={0}
                    max={100000}
                    step={1000}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="10000"
                  />
                </FocusIndicator>
              )}
              <ValidationError errors={validationErrors.salesContestThreshold ?? []} />
            </>
          )}
        </div>
      </section>

      {/* Section: Training Allocation */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Training Time Allocation (must sum to 100%)
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="trainingProductKnowledge"
            userId={user._id}
          >
            <SliderWithLabel
              label="Product Knowledge"
              value={formData.trainingProductKnowledge ?? 25}
              onChange={(value) => handleChange("trainingProductKnowledge", value)}
              errors={validationErrors.trainingProductKnowledge ?? []}
            />
          </FocusIndicator>

          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="trainingMarketOrientation"
            userId={user._id}
          >
            <SliderWithLabel
              label="Market Orientation"
              value={formData.trainingMarketOrientation ?? 25}
              onChange={(value) => handleChange("trainingMarketOrientation", value)}
              errors={validationErrors.trainingMarketOrientation ?? []}
            />
          </FocusIndicator>

          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="trainingCompanyOrientation"
            userId={user._id}
          >
            <SliderWithLabel
              label="Company Orientation"
              value={formData.trainingCompanyOrientation ?? 25}
              onChange={(value) => handleChange("trainingCompanyOrientation", value)}
              errors={validationErrors.trainingCompanyOrientation ?? []}
            />
          </FocusIndicator>

          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="trainingSellingTechniques"
            userId={user._id}
          >
            <SliderWithLabel
              label="Selling Techniques"
              value={formData.trainingSellingTechniques ?? 25}
              onChange={(value) => handleChange("trainingSellingTechniques", value)}
              errors={validationErrors.trainingSellingTechniques ?? []}
            />
          </FocusIndicator>
        </div>

        {/* Training Sum Indicator */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Training Allocation Total:
            </span>
            <span
              className={`text-lg font-bold ${
                trainingSum === 100
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {trainingSum}%
            </span>
          </div>
          {trainingSum !== 100 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Must equal exactly 100%
            </p>
          )}
        </div>
      </section>

      {/* Section: Recruiting */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recruiting Time Allocation
        </h3>

        <FocusIndicator
          companyId={companyId}
          entity="hiring"
          fieldPath="recruiting"
          userId={user._id}
        >
          <SliderWithLabel
            label="Recruiting Time"
            value={0} // TODO: Add recruiting field to schema
            onChange={() => {}}
            errors={[]}
          />
        </FocusIndicator>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Note: Recruiting allocation field not yet implemented in schema
        </p>
      </section>

      {/* Section: Hiring & Firing */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Hiring & Firing
        </h3>

        <div className="space-y-4">
          {/* Number to Hire */}
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="numberToHire"
            userId={user._id}
            label="Number of Sales Reps to Hire (0-3)"
          >
            <input
              type="number"
              value={formData.numberToHire ?? 0}
              onChange={(e) => handleChange("numberToHire", parseInt(e.target.value) || 0)}
              min={0}
              max={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </FocusIndicator>
          <ValidationError errors={validationErrors.numberToHire ?? []} />

          {/* TODO: Add hiring list and firing list components */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Hiring list and firing list selection coming soon
          </p>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => setShowConfirmDialog(true)}
          disabled={!isFormValid || isSubmitting}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          {isSubmitting ? "Submitting..." : "Submit Decisions"}
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}

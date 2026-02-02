/**
 * Example Decision Form - Demonstrates presence integration
 *
 * This example shows how to integrate all presence components into a decision form:
 * - CompanyPresenceHeader at the top
 * - FocusIndicator wrapping each input
 * - Real-time collaboration indicators
 * - Last edited tracking
 *
 * This is a HIRING decision form example for the Capo business simulation.
 *
 * @example
 * ```tsx
 * function HiringDecisionPage() {
 *   const user = useCurrentUser();
 *   const company = useQuery(api.companies.get, { id: user.companyId });
 *
 *   if (!user.companyId) return <div>Loading...</div>;
 *
 *   return (
 *     <div className="max-w-2xl mx-auto p-6">
 *       <CompanyPresenceHeader
 *         companyId={user.companyId}
 *         companyName={company?.name}
 *         showOfflineTooltip
 *       />
 *       <ExampleDecisionForm
 *         companyId={user.companyId}
 *         userId={user._id}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */

import React, { useState } from "react";
import { Id } from "@convex/_generated/dataModel";
import { CompanyPresenceHeader } from "./CompanyPresenceHeader";
import { FocusIndicator } from "./FocusIndicator";

export interface ExampleDecisionFormProps {
  /** The company ID */
  companyId: Id<"companies"> | string;
  /** Current user ID */
  userId: Id<"users"> | string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ExampleDecisionForm - Hiring decision form with presence
 *
 * Demonstrates:
 * 1. CompanyPresenceHeader for room-level presence
 * 2. FocusIndicator for field-level focus tracking
 * 3. Multi-user collaboration indicators
 * 4. Last edited tracking
 *
 * @param companyId - Company ID
 * @param userId - Current user ID
 * @param className - Additional CSS classes
 */
export function ExampleDecisionForm({
  companyId,
  userId,
  className = "",
}: ExampleDecisionFormProps) {
  // Form state (simplified for demo)
  const [formData, setFormData] = useState({
    salary: 50000,
    commission: 5,
    benefits: "bronze" as "bronze" | "silver" | "gold",
    travel: "reps_pay_own" as "reps_pay_own" | "monthly_per_diem" | "unlimited",
    perDiem: 200,
    hasSalesContest: false,
    salesContestType: "open" as "open" | "closed",
    salesContestThreshold: 10000,
    trainingProductKnowledge: 25,
    trainingMarketOrientation: 25,
    trainingCompanyOrientation: 25,
    trainingSellingTechniques: 25,
    numberToHire: 0,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section: Compensation */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Compensation Package
        </h3>

        <div className="space-y-4">
          {/* Salary Input */}
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="salary"
            userId={userId}
            label="Annual Base Salary (USD)"
          >
            <input
              type="number"
              value={formData.salary}
              onChange={(e) => handleChange("salary", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="50000"
            />
          </FocusIndicator>

          {/* Commission Input */}
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="commission"
            userId={userId}
            label="Commission Percentage (%)"
          >
            <input
              type="number"
              value={formData.commission}
              onChange={(e) => handleChange("commission", parseFloat(e.target.value))}
              min="0"
              max="100"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="5"
            />
          </FocusIndicator>

          {/* Benefits Select */}
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="benefits"
            userId={userId}
            label="Benefits Package"
          >
            <select
              value={formData.benefits}
              onChange={(e) => handleChange("benefits", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </FocusIndicator>

          {/* Travel Package */}
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="travel"
            userId={userId}
            label="Travel Expenses"
          >
            <select
              value={formData.travel}
              onChange={(e) => handleChange("travel", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="reps_pay_own">Reps pay own travel</option>
              <option value="monthly_per_diem">Monthly per diem</option>
              <option value="unlimited">Unlimited travel budget</option>
            </select>
          </FocusIndicator>

          {/* Per Diem (conditional) */}
          {formData.travel === "monthly_per_diem" && (
            <FocusIndicator
              companyId={companyId}
              entity="hiring"
              fieldPath="perDiem"
              userId={userId}
              label="Monthly Per Diem (USD)"
            >
              <input
                type="number"
                value={formData.perDiem}
                onChange={(e) => handleChange("perDiem", parseInt(e.target.value))}
                min="200"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="200"
              />
            </FocusIndicator>
          )}
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
            userId={userId}
            label="Enable Sales Contest?"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasSalesContest"
                checked={formData.hasSalesContest}
                onChange={(e) => handleChange("hasSalesContest", e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="hasSalesContest" className="text-sm text-gray-700 dark:text-gray-300">
                Run a sales contest this quarter
              </label>
            </div>
          </FocusIndicator>

          {/* Sales Contest Type */}
          {formData.hasSalesContest && (
            <>
              <FocusIndicator
                companyId={companyId}
                entity="hiring"
                fieldPath="salesContestType"
                userId={userId}
                label="Contest Type"
              >
                <select
                  value={formData.salesContestType}
                  onChange={(e) => handleChange("salesContestType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="open">Open (all reps compete)</option>
                  <option value="closed">Closed (selected reps only)</option>
                </select>
              </FocusIndicator>

              <FocusIndicator
                companyId={companyId}
                entity="hiring"
                fieldPath="salesContestThreshold"
                userId={userId}
                label="Sales Threshold (USD)"
              >
                <input
                  type="number"
                  value={formData.salesContestThreshold}
                  onChange={(e) => handleChange("salesContestThreshold", parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="10000"
                />
              </FocusIndicator>
            </>
          )}
        </div>
      </section>

      {/* Section: Training Allocation */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Training Time Allocation (must sum to 100%)
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FocusIndicator
              companyId={companyId}
              entity="hiring"
              fieldPath="trainingProductKnowledge"
              userId={userId}
              label="Product Knowledge (%)"
            >
              <input
                type="number"
                value={formData.trainingProductKnowledge}
                onChange={(e) => handleChange("trainingProductKnowledge", parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </FocusIndicator>

            <FocusIndicator
              companyId={companyId}
              entity="hiring"
              fieldPath="trainingMarketOrientation"
              userId={userId}
              label="Market Orientation (%)"
            >
              <input
                type="number"
                value={formData.trainingMarketOrientation}
                onChange={(e) => handleChange("trainingMarketOrientation", parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </FocusIndicator>

            <FocusIndicator
              companyId={companyId}
              entity="hiring"
              fieldPath="trainingCompanyOrientation"
              userId={userId}
              label="Company Orientation (%)"
            >
              <input
                type="number"
                value={formData.trainingCompanyOrientation}
                onChange={(e) => handleChange("trainingCompanyOrientation", parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </FocusIndicator>

            <FocusIndicator
              companyId={companyId}
              entity="hiring"
              fieldPath="trainingSellingTechniques"
              userId={userId}
              label="Selling Techniques (%)"
            >
              <input
                type="number"
                value={formData.trainingSellingTechniques}
                onChange={(e) => handleChange("trainingSellingTechniques", parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </FocusIndicator>
          </div>

          {/* Sum indicator */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total:{" "}
            <span
              className={
                formData.trainingProductKnowledge +
                  formData.trainingMarketOrientation +
                  formData.trainingCompanyOrientation +
                  formData.trainingSellingTechniques ===
                100
                  ? "text-green-600 dark:text-green-400 font-semibold"
                  : "text-red-600 dark:text-red-400 font-semibold"
              }
            >
              {formData.trainingProductKnowledge +
                formData.trainingMarketOrientation +
                formData.trainingCompanyOrientation +
                formData.trainingSellingTechniques}
              %
            </span>
          </div>
        </div>
      </section>

      {/* Section: Hiring & Firing */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Hiring & Firing
        </h3>

        <div className="space-y-4">
          <FocusIndicator
            companyId={companyId}
            entity="hiring"
            fieldPath="numberToHire"
            userId={userId}
            label="Number of Sales Reps to Hire (0-3)"
          >
            <input
              type="number"
              value={formData.numberToHire}
              onChange={(e) => handleChange("numberToHire", parseInt(e.target.value))}
              min="0"
              max="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </FocusIndicator>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => {
            alert("Form submitted! (Demo only - no backend connected)");
          }}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Submit Decisions
        </button>
      </div>
    </div>
  );
}

/**
 * Complete Page Example - Shows full integration
 *
 * This example demonstrates the complete presence integration for a decision page.
 */
export function ExampleDecisionPage() {
  // In a real app, these would come from auth and queries
  const mockCompanyId = "company123" as Id<"companies">;
  const mockUserId = "user456" as Id<"users">;
  const mockCompanyName = "Capo Corp A";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header with Presence */}
        <CompanyPresenceHeader
          companyId={mockCompanyId}
          companyName={mockCompanyName}
          showOfflineTooltip
          className="mb-8"
        />

        {/* Decision Form */}
        <ExampleDecisionForm
          companyId={mockCompanyId}
          userId={mockUserId}
        />

        {/* Collaboration Tips */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            Collaboration Features
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Focus on any input to see teammates viewing the same field</li>
            <li>• Multiple users focusing on the same field shows a purple border</li>
            <li>• Avatars show who's currently viewing each field</li>
            <li>• Header shows all online teammates in your company</li>
            <li>• Hover over "X offline" to see teammates who aren't online</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

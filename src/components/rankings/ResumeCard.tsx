/**
 * ResumeCard Component - Display individual resume profile
 *
 * Shows a candidate's resume information including:
 * - Name and basic info (gender, education, experience)
 * - Intelligence score and Myers-Briggs type
 * - Other information and interview notes
 * - Reference check results
 *
 * Features:
 * - Clean, scannable layout for quick review
 * - Highlight key metrics (intelligence, personality type)
 * - Organized sections for easy reading
 * - Responsive design
 *
 * @example
 * ```tsx
 * function SortingPage() {
 *   const resume = useQuery(api.resumes.getByRepId, { repId: "rep1" });
 *
 *   return <ResumeCard resume={resume} />;
 * }
 * ```
 */

import React from "react";
import { Doc } from "../../convex/_generated/dataModel";

export interface ResumeCardProps {
  /** Resume document from Convex */
  resume: Doc<"resumes"> | null | undefined;
  /** Optional CSS classes */
  className?: string;
  /** Whether to show compact view (for lists) */
  compact?: boolean;
}

/**
 * Format education for display
 */
function formatEducation(education: string): string {
  // Education is typically like "Bachelor's in Business"
  return education;
}

/**
 * Format experience for display
 */
function formatExperience(experience: string): string {
  // Experience is typically like "5 years in sales"
  return experience;
}

/**
 * ResumeCard - Display candidate profile
 *
 * @param resume - Resume document
 * @param className - Optional CSS classes
 * @param compact - Show compact view (default: false)
 */
export function ResumeCard({
  resume,
  className = "",
  compact = false,
}: ResumeCardProps) {
  if (!resume) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading resume...
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {resume.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {resume.education}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {resume.experience}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Intelligence: {resume.intelligence}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {resume.myers_briggs}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {resume.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Candidate: {resume.repId}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {resume.gender === "M" ? "Male" : "Female"}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Intelligence Score
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {resume.intelligence}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Scale: 1-10 (higher is better)
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Personality Type
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {resume.myers_briggs}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Myers-Briggs Type Indicator
          </div>
        </div>
      </div>

      {/* Background */}
      <div className="space-y-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Education
          </h3>
          <p className="text-gray-900 dark:text-gray-100">
            {formatEducation(resume.education)}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Work Experience
          </h3>
          <p className="text-gray-900 dark:text-gray-100">
            {formatExperience(resume.experience)}
          </p>
        </div>
      </div>

      {/* Assessment Notes */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        {resume.other_info && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Additional Information
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {resume.other_info}
            </p>
          </div>
        )}

        {resume.interview && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Interview Notes
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {resume.interview}
            </p>
          </div>
        )}

        {resume.reference_check && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Reference Check
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {resume.reference_check}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

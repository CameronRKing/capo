/**
 * Collaboration Components - Real-time presence and focus tracking
 *
 * Exports all collaboration components for decision form integration.
 *
 * @example
 * ```tsx
 * import {
 *   FocusIndicator,
 *   CompanyPresenceHeader,
 *   FacePile,
 *   ExampleDecisionForm
 * } from "@/components/collaboration";
 * ```
 */

// Core components
export { FocusIndicator } from "./FocusIndicator";
export type { FocusIndicatorProps } from "./FocusIndicator";

export { CompanyPresenceHeader } from "./CompanyPresenceHeader";
export type { CompanyPresenceHeaderProps } from "./CompanyPresenceHeader";

export { FacePile } from "./FacePile";
export type { FacePileProps, FacePileUser } from "./FacePile";

// Example/demo components
export { ExampleDecisionForm, ExampleDecisionPage } from "./ExampleDecisionForm";
export type { ExampleDecisionFormProps } from "./ExampleDecisionForm";

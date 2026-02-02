/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accessRequests from "../accessRequests.js";
import type * as admin_compilation from "../admin/compilation.js";
import type * as admin_index from "../admin/index.js";
import type * as auth_callbacks from "../auth/callbacks.js";
import type * as auth_config from "../auth/config.js";
import type * as auth_test from "../auth/test.js";
import type * as authMutation from "../authMutation.js";
import type * as compilation_hiring from "../compilation/hiring.js";
import type * as compilation_index from "../compilation/index.js";
import type * as compilation_leadership from "../compilation/leadership.js";
import type * as domain_accessRequests from "../domain/accessRequests.js";
import type * as domain_activeReps from "../domain/activeReps.js";
import type * as domain_companies from "../domain/companies.js";
import type * as domain_decisions_persistence from "../domain/decisions/persistence.js";
import type * as domain_decisions_validators from "../domain/decisions/validators.js";
import type * as domain_games from "../domain/games.js";
import type * as domain_index from "../domain/index.js";
import type * as domain_internal from "../domain/internal.js";
import type * as domain_leadershipDecisions from "../domain/leadershipDecisions.js";
import type * as domain_rankings from "../domain/rankings.js";
import type * as domain_rankings_algorithm from "../domain/rankings/algorithm.js";
import type * as domain_reports from "../domain/reports.js";
import type * as domain_resumes from "../domain/resumes.js";
import type * as domain_territories from "../domain/territories.js";
import type * as domain_test from "../domain/test.js";
import type * as domain_users from "../domain/users.js";
import type * as internal_index from "../internal/index.js";
import type * as internal_mutations from "../internal/mutations.js";
import type * as internal_queries from "../internal/queries.js";
import type * as myFunctions from "../myFunctions.js";
import type * as seed from "../seed.js";
import type * as services_constants from "../services/constants.js";
import type * as services_permissions from "../services/permissions.js";
import type * as services_presence from "../services/presence.js";
import type * as services_presenceFocus from "../services/presenceFocus.js";
import type * as services_rowLevelSecurity from "../services/rowLevelSecurity.js";
import type * as services_seedData_counties from "../services/seedData/counties.js";
import type * as services_seedData_resumes from "../services/seedData/resumes.js";
import type * as services_types from "../services/types.js";
import type * as student_dashboard from "../student/dashboard.js";
import type * as teacher_dashboard from "../teacher/dashboard.js";
import type * as teacher_monitoring from "../teacher/monitoring.js";
import type * as test_compilationHelpers from "../test/compilationHelpers.js";
import type * as test_index from "../test/index.js";
import type * as test_testHelpers from "../test/testHelpers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accessRequests: typeof accessRequests;
  "admin/compilation": typeof admin_compilation;
  "admin/index": typeof admin_index;
  "auth/callbacks": typeof auth_callbacks;
  "auth/config": typeof auth_config;
  "auth/test": typeof auth_test;
  authMutation: typeof authMutation;
  "compilation/hiring": typeof compilation_hiring;
  "compilation/index": typeof compilation_index;
  "compilation/leadership": typeof compilation_leadership;
  "domain/accessRequests": typeof domain_accessRequests;
  "domain/activeReps": typeof domain_activeReps;
  "domain/companies": typeof domain_companies;
  "domain/decisions/persistence": typeof domain_decisions_persistence;
  "domain/decisions/validators": typeof domain_decisions_validators;
  "domain/games": typeof domain_games;
  "domain/index": typeof domain_index;
  "domain/internal": typeof domain_internal;
  "domain/leadershipDecisions": typeof domain_leadershipDecisions;
  "domain/rankings": typeof domain_rankings;
  "domain/rankings/algorithm": typeof domain_rankings_algorithm;
  "domain/reports": typeof domain_reports;
  "domain/resumes": typeof domain_resumes;
  "domain/territories": typeof domain_territories;
  "domain/test": typeof domain_test;
  "domain/users": typeof domain_users;
  "internal/index": typeof internal_index;
  "internal/mutations": typeof internal_mutations;
  "internal/queries": typeof internal_queries;
  myFunctions: typeof myFunctions;
  seed: typeof seed;
  "services/constants": typeof services_constants;
  "services/permissions": typeof services_permissions;
  "services/presence": typeof services_presence;
  "services/presenceFocus": typeof services_presenceFocus;
  "services/rowLevelSecurity": typeof services_rowLevelSecurity;
  "services/seedData/counties": typeof services_seedData_counties;
  "services/seedData/resumes": typeof services_seedData_resumes;
  "services/types": typeof services_types;
  "student/dashboard": typeof student_dashboard;
  "teacher/dashboard": typeof teacher_dashboard;
  "teacher/monitoring": typeof teacher_monitoring;
  "test/compilationHelpers": typeof test_compilationHelpers;
  "test/index": typeof test_index;
  "test/testHelpers": typeof test_testHelpers;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  presence: {
    public: {
      disconnect: FunctionReference<
        "mutation",
        "internal",
        { sessionToken: string },
        null
      >;
      heartbeat: FunctionReference<
        "mutation",
        "internal",
        {
          interval?: number;
          roomId: string;
          sessionId: string;
          userId: string;
        },
        { roomToken: string; sessionToken: string }
      >;
      list: FunctionReference<
        "query",
        "internal",
        { limit?: number; roomToken: string },
        Array<{
          data?: any;
          lastDisconnected: number;
          online: boolean;
          userId: string;
        }>
      >;
      listRoom: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; roomId: string },
        Array<{ lastDisconnected: number; online: boolean; userId: string }>
      >;
      listUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; userId: string },
        Array<{ lastDisconnected: number; online: boolean; roomId: string }>
      >;
      removeRoom: FunctionReference<
        "mutation",
        "internal",
        { roomId: string },
        null
      >;
      removeRoomUser: FunctionReference<
        "mutation",
        "internal",
        { roomId: string; userId: string },
        null
      >;
      updateRoomUser: FunctionReference<
        "mutation",
        "internal",
        { data?: any; roomId: string; userId: string },
        null
      >;
    };
  };
};

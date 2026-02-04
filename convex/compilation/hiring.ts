import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { MIN_REPS, MAX_HIRE_COUNT, ASSUMED_SALES_PER_QTR, RECRUITING_BONUS } from "../services/constants";
import { SALES_CONTEST_MULTIPLIER } from "../domain/decisions/validators";

/**
 * Hiring Compilation Action
 *
 * Compiles hiring decisions for all companies in a game/quarter.
 * This includes:
 * 1. Calculating company attractiveness for poaching
 * 2. Applying poaching rules (Q1 prohibition, MIN_REPS, recently poached)
 * 3. Running hiring draft algorithm
 * 4. Generating outcome reports
 *
 * Full business logic from legacy codebase will be implemented post-MVP.
 */
export const _compileHiringDecisions = action({
  args: {
    gameId: v.id("games"),
    quarter: v.number(),
  },
  handler: async (ctx, { gameId, quarter }) => {
    // 1. Get all companies in the game
    const companies = await ctx.runQuery(internal.listGameCompanies, { gameId });

    if (!companies || companies.length === 0) {
      throw new Error(`No companies found for game ${gameId}`);
    }

    const results = {
      companiesProcessed: 0,
      poachingEvents: 0,
      hiringEvents: 0,
      errors: [] as string[],
    };

    // 2. Gather all hiring decisions and active reps
    const companyData: Array<{
      company: any;
      decisions: any;
      activeReps: any[];
      hiringList: string[];
      attractiveness: number;
    }> = [];

    for (const company of companies) {
      try {
        const decisions = await ctx.runQuery(internal.getHiringDecision, {
          companyId: company._id,
          quarter,
        });

        const activeReps = await ctx.runQuery(internal.getActiveReps, {
          companyId: company._id,
          quarter,
        });

        const hiringList = await ctx.runQuery(internal.getHiringList, {
          companyId: company._id,
          quarter,
        });

        if (!decisions) {
          results.errors.push(`No hiring decisions found for company ${company.name}`);
          continue;
        }

        // Calculate attractiveness index
        const attractiveness = calculateAttractiveness(decisions, activeReps.length);

        companyData.push({
          company,
          decisions,
          activeReps,
          hiringList,
          attractiveness,
        });
      } catch (error) {
        results.errors.push(
          `Error gathering data for company ${company.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // 3. Apply poaching rules
    const poachingEvents = applyPoachingRules(
      companyData,
      quarter,
      `${gameId}_${quarter}`
    );

    // 4. Run hiring draft
    const hiringOutcomes = runHiringDraft(
      companyData,
      poachingEvents,
      `${gameId}_${quarter}`
    );

    // 5. Generate outcome reports for each company
    for (const data of companyData) {
      try {
        const oldRepOutcomes: Array<{
          repId: string;
          outcome: "retained" | "poached";
        }> = data.activeReps.map((rep) => {
          const poached = poachingEvents.find(
            (p) => p.fromCompanyId === data.company._id && p.repId === rep.repId
          );

          return {
            repId: rep.repId,
            outcome: poached ? "poached" : "retained",
          };
        });

        const newRepOutcomes: Array<{
          repId: string;
          outcome: "hired" | "not_hired";
        }> = hiringOutcomes
          .filter((h) => h.toCompanyId === data.company._id)
          .map((h) => ({
            repId: h.repId,
            outcome: "hired" as const,
          }));

        // Add reps from hiring list who weren't hired
        for (const repId of data.hiringList) {
          if (!newRepOutcomes.find((o) => o.repId === repId)) {
            newRepOutcomes.push({
              repId,
              outcome: "not_hired" as const,
            });
          }
        }

        await ctx.runMutation(internal.createHiringOutcomeReport, {
          companyId: data.company._id,
          quarter,
          oldRepOutcomes,
          newRepOutcomes,
        });

        results.companiesProcessed++;
        results.poachingEvents += oldRepOutcomes.filter((o) => o.outcome === "poached").length;
        results.hiringEvents += newRepOutcomes.filter((o) => o.outcome === "hired").length;
      } catch (error) {
        results.errors.push(
          `Error creating outcome report for company ${data.company.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return {
      success: results.errors.length === 0,
      ...results,
    };
  },
});

/**
 * Calculate company attractiveness index for poaching
 *
 * Formula (from legacy code):
 * attractiveness = salary + (assumed_sales * commission/100) + benefits_value +
 *                   travel_value + (recruiting_pct * recruiting_bonus) +
 *                   (contest ? sales_contest_multiplier : 0)
 */
function calculateAttractiveness(
  decisions: any,
  repCount: number
): number {
  // Quarterly salary
  const quarterlySalary = decisions.salary / 4;

  // Estimated quarterly commission
  const quarterlyCommission = (ASSUMED_SALES_PER_QTR * decisions.commission) / 100;

  // Benefits value (bronze: 0, silver: 2000, gold: 5000)
  const benefitsValue: Record<string, number> = {
    bronze: 0,
    silver: 2000,
    gold: 5000,
  };
  const benefits = benefitsValue[decisions.benefits] || 0;

  // Travel value (reps_pay_own: 0, monthly_per_diem: per_diem * 3, unlimited: 3000)
  let travelValue = 0;
  if (decisions.travel === "monthly_per_diem") {
    travelValue = (decisions.perDiem || 0) * 3;
  } else if (decisions.travel === "unlimited") {
    travelValue = 3000;
  }

  // Sales contest bonus
  const contestBonus = decisions.hasSalesContest ? SALES_CONTEST_MULTIPLIER * 1000 : 0;

  // Recruiting time bonus (from leadership decisions - stub: assume 25%)
  const recruitingPercentage = 0.25; // Would come from leadership decisions
  const recruitingBonus = recruitingPercentage * RECRUITING_BONUS;

  return (
    quarterlySalary +
    quarterlyCommission +
    benefits +
    travelValue +
    recruitingBonus +
    contestBonus
  );
}

/**
 * Apply poaching rules
 *
 * Rules:
 * 1. Q1 prohibition: No poaching in Q1
 * 2. MIN_REPS protection: Cannot poach from companies at MIN_REPS
 * 3. Recently poached: Reps poached in previous quarter cannot be poached again
 *
 * For MVP: Stub implementation with basic rules
 */
function applyPoachingRules(
  companyData: Array<{
    company: any;
    decisions: any;
    activeReps: any[];
    hiringList: string[];
    attractiveness: number;
  }>,
  quarter: number,
  seed: string
): Array<{ fromCompanyId: string; toCompanyId: string; repId: string }> {
  const poachingEvents: Array<{ fromCompanyId: string; toCompanyId: string; repId: string }> = [];

  // Rule 1: No poaching in Q1
  if (quarter === 1) {
    return poachingEvents;
  }

  const seededRandom = seededRandomGenerator(seed);

  // Sort companies by attractiveness (descending)
  const sortedByAttractiveness = [...companyData].sort(
    (a, b) => b.attractiveness - a.attractiveness
  );

  // Each company attempts to poach from less attractive companies
  for (const poacher of sortedByAttractiveness) {
    for (const target of companyData) {
      // Skip self and companies with equal/higher attractiveness
      if (target.company._id === poacher.company._id || target.attractiveness >= poacher.attractiveness) {
        continue;
      }

      // Rule 2: MIN_REPS protection
      if (target.activeReps.length <= MIN_REPS) {
        continue;
      }

      // Attempt to poach reps (simplified: 10% chance per rep)
      for (const rep of target.activeReps) {
        // Use seeded random for reproducibility
        const poachChance = seededRandom();

        // Higher attractiveness difference = higher poach chance
        const attractivenessDiff = poacher.attractiveness - target.attractiveness;
        const threshold = Math.min(0.3, attractivenessDiff / 50000); // Max 30% chance

        if (poachChance < threshold) {
          // Check if already being poached
          const alreadyPoached = poachingEvents.some(
            (p) => p.repId === rep.repId && p.fromCompanyId === target.company._id
          );

          if (!alreadyPoached) {
            poachingEvents.push({
              fromCompanyId: target.company._id,
              toCompanyId: poacher.company._id,
              repId: rep.repId,
            });
          }
        }
      }
    }
  }

  return poachingEvents;
}

/**
 * Run hiring draft algorithm
 *
 * Companies hire reps in order of:
 * 1. Number of reps they want to hire (fewer reps = higher priority)
 * 2. Attractiveness (higher attractiveness = higher priority when tied)
 *
 * Each company hires from their hiring list until they reach their target or run out of candidates.
 * Candidates can only be hired once.
 */
function runHiringDraft(
  companyData: Array<{
    company: any;
    decisions: any;
    activeReps: any[];
    hiringList: string[];
    attractiveness: number;
  }>,
  poachingEvents: Array<{ fromCompanyId: string; toCompanyId: string; repId: string }>,
  seed: string
): Array<{ toCompanyId: string; repId: string }> {
  const hiringOutcomes: Array<{ toCompanyId: string; repId: string }> = [];
  const hiredReps = new Set<string>();

  // Calculate current rep counts (after poaching)
  const repCounts = new Map<string, number>();
  for (const data of companyData) {
    const initialCount = data.activeReps.length;
    const poached = poachingEvents.filter((p) => p.fromCompanyId === data.company._id).length;
    const gained = poachingEvents.filter((p) => p.toCompanyId === data.company._id).length;
    repCounts.set(data.company._id, initialCount - poached + gained);
  }

  // Sort companies by hiring priority
  const sortedByPriority = [...companyData].sort((a, b) => {
    // Priority 1: Fewer current reps (relative to what they want to hire)
    const aReps = repCounts.get(a.company._id) || 0;
    const bReps = repCounts.get(b.company._id) || 0;
    const aWants = a.decisions.numberToHire;
    const bWants = b.decisions.numberToHire;

    const aNeeds = aWants - (aReps - a.activeReps.length);
    const bNeeds = bWants - (bReps - b.activeReps.length);

    if (aNeeds !== bNeeds) {
      return bNeeds - aNeeds; // Higher need = higher priority
    }

    // Priority 2: Higher attractiveness
    return b.attractiveness - a.attractiveness;
  });

  // Run draft rounds
  for (const company of sortedByPriority) {
    const currentReps = repCounts.get(company.company._id) || 0;
    const wantToHire = company.decisions.numberToHire;
    const canHire = Math.min(wantToHire, MAX_HIRE_COUNT);

    let hired = 0;

    // Try to hire from hiring list
    for (const repId of company.hiringList) {
      if (hired >= canHire) break;
      if (hiredReps.has(repId)) continue;

      hiringOutcomes.push({
        toCompanyId: company.company._id,
        repId,
      });

      hiredReps.add(repId);
      hired++;
      repCounts.set(company.company._id, currentReps + hired);
    }
  }

  return hiringOutcomes;
}

/**
 * Seeded random number generator for reproducible results
 */
function seededRandomGenerator(seed: string): () => number {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use hash as seed for simple LCG
  let state = Math.abs(hash);

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

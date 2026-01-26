import gamesSchema from '@s/Game.schema';
import companySchema from '@s/Company.schema';
import activeRepSchema from '@s/ActiveRep.schema';
import hiringDecisionSchema from '@s/HiringDecision.schema';
import leadershipDecisionSchema from '@s/LeadershipDecision.schema';

const collections = {
  games: gamesSchema,
  companies: companySchema,
  active_reps: activeRepSchema,
  hiring_decisions: hiringDecisionSchema,
  leadership_decisions: leadershipDecisionSchema
} as const;

export default collections;

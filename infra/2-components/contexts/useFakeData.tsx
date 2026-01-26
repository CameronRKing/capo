import { NutopiaDatabase, Types, useDB, useColl, useDoc } from '@database';
import { useEffect } from 'react';

export default function useFakeData() {
    const db = useDB();
    useFakeActiveReps(db);
    useFakeHiringDecision(db);
    useFakeLeadershipDecision(db);
}

function useFakeGame(db: NutopiaDatabase, quarter=1) {

}

function useFakeActiveReps(db: NutopiaDatabase, companyId='company1', quarter=0) {
  const [reps, { isFetching }] = useColl('active_reps', { companyId, quarter });

  useEffect(() => {
    if (!isFetching && reps.length === 0) {
      const makeRep = (id: string) => db.active_reps.insert({
        companyId,
        quarter,
        repId: 'rep' + id
      });
      
      makeRep('1');
      makeRep('2');
      makeRep('3');
      makeRep('4');
      makeRep('5');
    }
  }, [reps, isFetching]);
}

function useFakeHiringDecision(db: NutopiaDatabase, companyId='company1', quarter=1) {
    // Create initial document if it doesn't exist
    const [decision, { isFetching }] = useDoc('hiring_decisions', { companyId, quarter });
  useEffect(() => {
    if (!db || isFetching || decision) return;

    async function createInitialDecision() {
      try {
        await db.hiring_decisions.insert({
          id: `${companyId}_${quarter}`,
          companyId,
          quarter,
          salary: 15000,
          commission: 5,
          benefits: 'silver',
          trainingTime: {
            companyOrientation: 25,
            marketIndustryOrientation: 25,
            productKnowledge: 25,
            sellingTechniques: 25
          }
        });
        console.log('decision created');
      } catch (err) {
        // Document might already exist, ignore error
        console.log('Decision already exists or creation failed:', err);
      }
    }

    createInitialDecision();
  }, [db, isFetching, decision, companyId, quarter]);
}

function useFakeLeadershipDecision(db: NutopiaDatabase, companyId='company1', quarter=1) {
    // Create initial document if it doesn't exist
    const [decision, { isFetching }] = useDoc('leadership_decisions', { companyId, quarter });
    
  useEffect(() => {
    if (!db || isFetching || decision) return;

    async function createInitialDecision() {
      try {
        await db.leadership_decisions.insert({
          id: `${companyId}_${quarter}`,
          companyId,
          quarter,
          managerTime: {
            individualSessions: 25,
            recruiting: 25,
            meetingWithCustomers: 25,
            salesPlanning: 25
          }
        });
        console.log('leadership decision created');
      } catch (err) {
        // Document might already exist, ignore error
        console.log('Leadership decision already exists or creation failed:', err);
      }
    }

    createInitialDecision();
  }, [db, isFetching, decision, companyId, quarter]);
}
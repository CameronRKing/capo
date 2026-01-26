export default {
    HiringDecision: {
        perDiem: (allModelData: any, lookup: any) => allModelData.travel === 'monthly_per_diem' ? lookup().format.currency() : null,
        salesContestType: (allModelData: any, lookup: any) => allModelData.hasSalesContest ? lookup().misc.radio() : null,
        salesContestThreshold: (allModelData: any, lookup: any) => {
            if (!allModelData.hasSalesContest) return null;
            if (allModelData.salesContestType === 'open') {
                const label = 'Sales Threshold for Winning';
                return lookup({ label }).format.currency();
            } else {
                const label = 'Number of Winners';
                return lookup({ label }).type.integer();
            }
        },
        numberToHire: (allModelData: any, lookup: any) => {
            const enumValues = [0, 1, 2, 3];
            return lookup({ enumValues }).misc.radio();
        }
    }
}
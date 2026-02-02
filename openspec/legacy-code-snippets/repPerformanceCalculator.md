```php
<?php

namespace App;

use App\Models\ActiveRep;
use App\Models\OtherDecision;
use App\Models\SalesDecision;

class PerformanceCalculator
{
    /**
     * Keep in mind that even though we're passing in ActiveRep, OtherDecision, and SalesDecision objects,
     * these objects have had some extra properties added to them for the purposes of this function
     *
     * See assertArgsHaveAllData() for details
     *
     * @param ActiveRep $rep
     * @param SalesDecision $salesDecision
     * @param OtherDecision $otherDecision
     **/
    public function calc(ActiveRep $rep, SalesDecision $salesDecision, OtherDecision $otherDecision, $reps=null)
    {
        $this->assertArgsHaveAllData($rep, $salesDecision, $otherDecision);

        $date_key = $rep->date_key;
        $perf = $rep->effort * $rep->sales;

        $perf += $this->isNewHireCheck($rep);
        $perf += $this->territoryMarketReportCheck($otherDecision);
        $perf += $this->trainingCheck($salesDecision);
        $perf += $this->salaryCheck($salesDecision);
        $perf += $this->commissionCheck($salesDecision);
        $perf += $this->travelCheck($salesDecision);
        $perf += $this->supervisionCheck($otherDecision);
        $perf += $this->individualHoursCheck($rep);
        $perf += $this->leadershipCheck($rep);
        $perf += $this->salesContestCheck($rep, $salesDecision, $reps);

        // can't be above or below certain numbers
        if ($perf < 1) {
            $perf = 1;
        }

        if ($perf > 10) {
            $perf = 10;
        }

        return $perf;
    }

    /**
     * A revealer function that tells us which modifiers were calculated
     * Not actually used anywhere, just helpful for debugging
     **/
    public function getModifiers(ActiveRep $rep, SalesDecision $salesDecision, OtherDecision $otherDecision)
    {
        $this->assertArgsHaveAllData($rep, $salesDecision, $otherDecision);

        $date_key = $rep->date_key;
        $perf = $rep->effort * $rep->sales;

        $modifiers = collect();
        $modifiers->put('isNewHire', $this->isNewHireCheck($rep));
        $modifiers->put('territoryMarketReport', $this->territoryMarketReportCheck($otherDecision));
        $modifiers->put('training', $this->trainingCheck($salesDecision));
        $modifiers->put('salary', $this->salaryCheck($salesDecision));
        $modifiers->put('commission', $this->commissionCheck($salesDecision));
        $modifiers->put('travel', $this->travelCheck($salesDecision));
        $modifiers->put('supervision', $this->supervisionCheck($otherDecision));
        $modifiers->put('individualHours', $this->individualHoursCheck($rep));
        $modifiers->put('leadership', $this->leadershipCheck($rep));
        $modifiers->put('salesContest', $this->salesContestCheck($rep));

        return $modifiers;
    }

    public function assertArgsHaveAllData(ActiveRep $rep, SalesDecision $salesDecision, OtherDecision $otherDecision)
    {
        if (!isset($rep->isNewHire)) {
            throw new \Exception('Field not set: isNewHire');
        }
        if (!isset($salesDecision->avgSalary)) {
            throw new \Exception('Field not set: avgSalary');
        }
        if (!isset($salesDecision->avgCommission)) {
            throw new \Exception('Field not set: avgCommission');
        }
    }

    public function isNewHireCheck(ActiveRep $rep)
    {
        if ($rep->isNewHire) {
            return -1;
        }
        return 0;
    }

    public function territoryMarketReportCheck(OtherDecision $otherDecision)
    {
        if ($otherDecision['territory_report'] == "1") {
            return -1;
        }
        return 0;
    }

    public function trainingCheck(SalesDecision $salesDecision)
    {
        // Training:
        // +1  Percent for all company reps if all training elements are at least at 10%;
        // and Company orientation is less than Product & less than Market-industry
        // -2  Percent for all company reps if any element is at zero
        $training = ['product_knowledge', 'market_orientation', 'company_orientation', 'selling_techniques'];
        $addOne   = true;
        foreach ($training as $field) {
            if ($salesDecision[$field] == 0) {
                return -2;
            } else if ($salesDecision[$field] < 10) {
                $addOne = false;
            }
        }
        if ($salesDecision['company_orientation'] < $salesDecision['product_knowledge']
            && $salesDecision['company_orientation'] < $salesDecision['market_orientation']
            && $addOne) {
            return 1;
        }
        return 0;
    }

    public function salaryCheck(SalesDecision $salesDecision)
    {
        if ($salesDecision['salary'] == 0) {
            return -2;
        } else if ($salesDecision['salary'] > $salesDecision->avgSalary) {
            return 1;
        }
        return 0;
    }

    public function commissionCheck(SalesDecision $salesDecision)
    {
        //Commission component of compensation:
        //    -3  If commission rate is zero
        //    -2  If commission rate is more than 2% below industry average
        //    -1  If commission rate is less than industry average by no more than 2%
        //    0   If commission rate is at industry average
        //    +1  If commission rate is more than industry average by no more than 2%
        //    +2  If commission rate is more than 2% above industry average, but less than 4%
        //    +3  If commission rate is 4% or more above industry average
        $diff = $salesDecision['commission'] - $salesDecision->avgCommission;
        if ($diff == -$salesDecision->avgCommission) { // A.K.A., no commission
            return -3;
        } else if ($diff < -2) {
            return -2;
        } else if ($diff < 0) {
            return -1;
        } else if ($diff >= 4) {
            return 3;
        } else if ($diff > 2) {
            return 2;
        } else if ($diff > 0) {
            return 1;
        }
        return 0;
    }

    public function travelCheck(SalesDecision $salesDecision)
    {
        //     -1 if reps pay own expenses
        if ($salesDecision->travel == 3) {
            return -1;
        }
        return 0;
    }

    public function supervisionCheck(OtherDecision $otherDecision)
    {
        // -1  If meeting with customers, sales planning, and/or adminstrative paperwork is less than 5%
        $supervision = ['recruiting', 'meeting_customers', 'sales_planning'];
        foreach ($supervision as $field) {
            if ($otherDecision[$field] < 5) {
                return -1;
            }
        }
        return 0;
    }

    public function individualHoursCheck(ActiveRep $rep)
    {
        if ($rep->individual_hours == 0) {
           return -1;
        } else if ($rep->individual_hours > 2) {
            return $rep->ind_hrs_2_plus;
        } else if ($rep->individual_hours >= 1) {
            return $rep->ind_hrs_0_1;
        }
        return 0;
    }

    public function leadershipCheck(ActiveRep $rep)
    {
        // -1  For each rep that is led by "incorrect" leader behavior
        // +1  For each rep that is led by "correct" leader behavior
        if ($rep->leadership_behavior == $rep->correct_leadership_behavior) {
           return 1;
        } else if ($rep->leadership_behavior == $rep->incorrect_leadership_behavior) {
            return -1;
        }
        return 0;
    }

    public function salesContestCheck(ActiveRep $rep, SalesDecision $salesDecision, $reps)
    {
        $boost = 0;
        $contestType = $salesDecision->sales_contest;
        if ($contestType == 2) $boost = 1;
        if ($contestType == 3) $boost = 2;

        if ($rep->isLowestQuality() || $salesDecision->isContestWinner($rep, $reps)) {
            return $boost;
        }

        return 0;
    }
}
```
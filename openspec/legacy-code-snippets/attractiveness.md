"otherDecisions" is early terminology; it refers to what I have been calling "leadership decisions".

```php
/**
 * Calculates the attractiveness index for this sales decision
 * and caches that value to $this->attrIndex
 *
 * Attractiveness index is a rough calculation of how much money
 * a rep can expect to make in a quarter. We make some assumptions about sales
 * and calculate benefits/travel expenses, then adjust for recruiting
 *
 * @
 **/
public function calcAttrIndex()
{
    // default to 0
    $recruiting = $this->company->otherDecisions()->previous($this->date_key)
        ->pluck('recruiting')->first() ?: 0;

    // commission is a percent stored as an integer. Convert to decimal for calculations.
    $assumedCommission = ($this->commission / 100) * Constants::ASSUMED_SALES_PER_QTR;
    $quarterlySalary = $this->salary / 4;
    $this->attrIndex = $quarterlySalary 
        + $assumedCommission
        + Utils::calcBenefitsExpenses($this->benefits, $quarterlySalary, $assumedCommission)
        + Utils::calcTravelExpenses($this->travel, $this->per_diem)
        + $this->estimatedSalesContestValue()
        + $recruiting * Constants::RECRUITING_BONUS;

    return $this->attrIndex;
}

private function estimatedSalesContestValue() {
    return $this->percentRepsExpectedToWinSalesContest()
        * $this->salesContestCost()
        * 7; // we multiple by 7 to give the sales contest a bigger effect on attractiveness
}

private function percentRepsExpectedToWinSalesContest() {
    if ($this->sales_contest_is_open) {
        $salesPool  = $this->representativeFirstQuarterSales();
        $numAboveThreshold = $salesPool
            ->filter(function($sales) { return $sales > $this->sales_contest_threshold; })
            ->count();

        return $numAboveThreshold / ($salesPool->count() ?: 1 );
    }

    return $this->sales_contest_threshold / (($this->currSizeOfStaff() + $this->num_to_hire) ?: 1);
}

// this should be moved to Constants.php
private function representativeFirstQuarterSales() {
    return collect([
        11000, 17000, 25000,
        36000, 37000, 46000,
        49000, 51000, 67000,
        68000, 69000, 75000,
        81000, 98000, 176000,
        195000, 222000, 223000,
        231000, 235000, 249000,
        277000, 279000, 295000,
        299000, 344000, 649000,
        729000
    ]);
}

private function currSizeOfStaff() {
    return $this->getStaff()->count();
}

public function getStaff() {
    return $this->company->activeReps()->previous($this->date_key)->get();
}

// this should also be moved to Constants.php
public function salesContestCost() {
    switch ($this->sales_contest) {
        case 0:
            return 0;
        case 1:
            return 50;
        case 2:
            return 1000;
        case 3:
            return 3000;
        default:
            throw new \Exception('Unrecognized sales_contest value: ' . $this->sales_contest);
    }
}

// ...
// within Utils.php:
/**
 * Calculates QUARTERLY travel expenses
 *
 * @param travel_id:    the id of the travel package
 * @param num_reps:     # of reps that the company owns --> needed for per_diem calculations
 * @param per_diem:     per diem, needed if travel_id = 2
 * @param sales:        $ of sales for the whole company (defaults to 300,000 for attractiveness index calculations)
 * @return $expenses
 **/
public static function calcTravelExpenses($travel_id, $per_diem, $sales = Constants::ASSUMED_SALES_PER_QTR, $num_reps = 1)
{
    switch ($travel_id) {
        case 1:
            return $sales * 0.03;
        case 2:
            assert(!is_null($per_diem) && is_numeric($per_diem), "Utils::calcTravelExpenses(): \$per_diem--number expected, '$per_diem' found!");
            return $per_diem * 3 * $num_reps; // * 3 because per_diem is for a month, but we're calculating for the whole quarter
        case 3:
            return 0;
        default:
            throw new Exception("Invalid travel_id!");
            break;
    }
}

/**
 * Calculates QUARTERLY benefits expenses
 *
 * @param benefits_id: the id of the benefits package
 * @param num_reps: # of reps that the company owns
 * @param quarterlySalary: the rep's salary
 * @param commissions: the $ of commissions (defaults to 10,000 per rep for attractiveness index calculations)
 * @return $expenses
 **/
public static function calcBenefitsExpenses($benefits_id, $quarterlySalary, $commissions, $num_reps = 1)
{
    switch ($benefits_id) {
        case 1:
            return ($commissions + ($quarterlySalary * $num_reps)) * 0.05;
        case 2:
            return ($commissions + ($quarterlySalary * $num_reps)) * 0.12 + ($num_reps * 400);
        case 3:
            return ($commissions + ($quarterlySalary * $num_reps)) * 0.17 + ($num_reps * 600);
        default:
            throw new \Exception("Invalid benefits_id!");
            break;
    }
}

// ...
// within Constants.php
class Constants {
    const MAX_HIRE_COUNT       = 3;
    const MIN_REPS             = 3;
    const COST_OF_GOODS        = 0.65;
    const TOTAL_PERFORMANCE    = 40;
    const POTENTIAL_PER_PERSON = 21.78; // originally double this number
    const POPULATION_PER_UNIT  = 20000;
    const MANAGER_COMMISSION   = 0.02;
    const MANAGER_SALARY_QTR   = 20000;
    const MANAGER_TRAVEL_QTR   = 750;
    const TERMINATION_EXPENSES = 15000;
    const TRAINING_EXPENSES    = 6000;
    const CLERICAL_EXPENSES    = 10000;
    const RENT_AND_UTILITIES   = 7500;
    const LEGAL_AND_OTHER      = 10000;
    const COMPANY_NAMES        = [1 => "Aromatics", "Bioscent", "Candelarium", "Dynowick"];
    const SALESREP_REPORT_COST = 10000;
    const RECRUITING_BONUS     = 2000;
    const COMPENSATION_REPORT_COST = 10000;
    const ASSUMED_SALES_PER_QTR = 300000;
}
```
```php
<?php

namespace App;

use App\Constants;
use App\Models\ActiveRep;
use App\Models\Company;
use App\Models\Finances;
use App\Models\Industry;
use App\Models\Territory;
use App\Reports\CompanyRepPerformanceReport;

class OtherCompiler
{
    private $lastTime;
    private $sim;

    // a helper function for optimizing compile time
    // easier to comment out the body than each call, 
    // especially since I may want to re-optimize in the future
    private function logTime($msg) {
        // $time = microtime(true);
        // \Log::info('    ' . $this->sim->id . ' ' . $msg . ' after ' . ($time - $this->lastTime));
        // $this->lastTime = $time;
    }

    // todo--documentation
    public function compile($sim)
    {
        $this->sim = $sim;
        $date_key = $sim->current_qtr;

        $this->lastTime = microtime(true);

        foreach ($sim->industries as $industry) {
            $industry->ensureDecisionsAreMade($date_key);

            $this->logTime('ensured decisions made');

            $this->checkForNotices($industry, $date_key);

            $this->logTime('notices checked for');

            $this->calcFinances($industry, $date_key);
            // no need to create new Territories or ActiveReps.
            // Both exist only for C2 date keys and will be created by SalesCompiler
        }
    }

    /**
     * Pulled this out into a separate function so I can use it for Finances::recalcAll()
     *
     * @param $industry, $date_key
     * @return void
     **/
    public function calcFinances($industry, $date_key)
    {
        $salesDecisions = $industry->companies->mapWithKeys(function($company) use ($date_key) {
            return [$company->id => $company->salesDecisions()->previous($date_key)->first()];
        });
        $companyDecisions = $industry->companies->mapWithKeys(function($company) use ($date_key, $salesDecisions) {
            return [
                $company->id => [
                    $salesDecisions,
                    $company->otherDecisions()->current($date_key)->first(),
                    $company->activeReps()->previous($date_key)->get(),
                ]
            ];
        });
        $this->logTime('decisions gotten');
        $terr = $industry->territories()->current($date_key)->with('county')->get();
        $reps = $industry->activeReps()->current($date_key)->hired()->with(['company', 'rep'])->get()
            ->map(function ($rep) use ($companyDecisions, $terr) {
                list($sales, $other, $reps) = $companyDecisions[$rep->company_id];
                $rep->setPerformance($sales, $other, $reps);
                // eager loading using ->with('territories') doesn't work
                // it sets one relation successfully, but fails on others
                // probably because the relationship is dynamic based on company position
                $rep->setRelation('territories',
                    $terr->filter(function($t) use ($rep) {
                        return $t->{"rep{$rep->company->position}_id"} == $rep->id;
                    })
                );
                $rep->total_sales = 0.0; // defaults to null. need to set it.
                return $rep;
            });
        $this->logTime('territories/reps retrieved; performance calculated');


        $this->calcSales($reps->mapWithKeys(function($rep) { return [$rep->id => $rep]; }), $terr);

        $this->logTime('sales calculated');

        $reps->each(function ($r) {$r->save();});
        $terr->each(function ($t) {$t->save();});

        $this->logTime('reps and territories saved');

        $finances = $industry->companies->map(function ($company) use ($date_key, $companyDecisions, $terr, $reps) {
            list($sales, $other, $prevReps) = $companyDecisions[$company->id];
            $sales = $sales[$company->id];
            $currReps = $reps->filter(function($r) use ($company) { return $r->company_id == $company->id; });
            return Finances::initialize($company, $date_key, $terr, $prevReps, $currReps, $sales, $other);
        });

        $this->logTime('finances initialized');

        $industry->companies->each(function($company) use ($finances, $date_key, $reps) {
            $companyReps = $reps->filter(function($rep) use ($company) {
                return $rep->company_id == $company->id;
            });
            $repReport = new CompanyRepPerformanceReport($company, $date_key, $companyReps);
            $this->logTime($company->position . ' rep performance report generated');
            TerritoryQuiz::generate($company->id, $date_key, $finances, $repReport);
            $this->logTime($company->position . ' quiz generated');
        });


    }

    /**
     * Calculates sales per rep
     * also calculates a rep's total sales, but does NOT save that information!
     * modifies $territories in-place by adding "rep[1234]_sales" property, but does NOT save that information!
     *
     * @param $reps (ActiveRep)
     * @param $territories (Territory)
     * @return nothing--modifies $territories in-place by adding "rep[1234]_sales" property
     **/
    public function calcSales($reps, $territories)
    {
        $territories->each(function($territory) use ($reps) {
            $territory->getRepIds()->map(function($id) use ($territory, $reps) {
                $rep = $reps[$id];

                $share    = $rep->performance / Constants::TOTAL_PERFORMANCE;
                $repSales = "rep{$rep->company->position}_sales";

                $sales = $territory->market_potential
                     * $share
                     * (min($rep->calls_made / $rep->total_calls, 1)) ** 2;
                $territory->$repSales = $sales;
                $rep->total_sales += $sales;
            });
        });
    }

    public function checkForNotices(Industry $industry, string $date_key)
    {
        foreach ($industry->companies as $company) {
            $company->checkForNotices($date_key);
        }
    }
}
```

ComapnyRepPerformanceReport.php
```php
<?php

namespace App\Reports;

use App\Constants;
use App\Utils;
use App\Models\Company;

/**
 * Builds a company's breakdown report for its own reps
 *
 * @param Company $company
 * @param string $date_key
 **/
class CompanyRepPerformanceReport
{
    public $company;
    public $date_key;
    public $reps;

    public function __construct(Company $company, string $date_key, $reps=null)
    {
        $this->company  = $company;
        $this->date_key = $date_key;
        $this->reps = $reps ? $reps : $company->activeReps()->current($date_key)->get();
        $this->reps = $this->reps->map(function($rep) { return $this->getRepData($rep); });
    }

    /**
     * Gathers/calculates data for this rep for viewing in the standard rep report
     *
     * @preconditions: assumes that the rep's date key is a CS
     *                 assumes that a SalesDecision exists for the previous date key
     *                 assumes that the current date key has already been compiled
     *                     -- calls_made and total_sales have been set
     * @return $collection[
     *                     "name",
     *                     "daysWorked",
     *                     "totalCalls",
     *                     "orders",
     *                     "sales",
     *                     "grossMargin",
     *                     "salary",
     *                     "commission",
     *                     "benefits",
     *                     "contest",
     *                     "travel",
     *                     "contributionMargin"
     *                     "marketShare"
     *                    ]
     **/
    public function getRepData($rep)
    {
        assert(substr($rep->date_key, 5, 1) == "2", "C2 date key expected; {$rep->date_key} found");
        srand($rep->id * 10000); // trying to reduce random number clumpiness. Currently not working.

        $toReturn = [
            'name'              => $rep->name,
            'sales'             => $rep->total_sales,
            'daysWorked'        => $rep->getDaysWorked(),
            'totalCalls'        => $rep->getCallsMade(),
            'battingAvg'        => $rep->getBattingAvg(),
            'workload'          => $rep->territories->sum('calls') / $rep->calls_per_qtr * 100]; // expressed as a percentage
        $toReturn = collect($toReturn);

        // get previous sales decision for this rep's company
        $decision = $rep->company->salesDecisions()->previous($rep->date_key)->first();
        assert(!is_null($decision), "CompanyRepPerofmrnaceReport@getRepData(): previous sales decision not found for rep {$rep->id} and date key {$rep->date_key}!");

        // salary--quarterly
        $toReturn->put("salary", $decision->salary / 4);
        $toReturn->put("commission", ($decision->commission / 100) * $rep->total_sales);

        // direct expenses
        $benefits = Utils::calcBenefitsExpenses($decision->benefits,
            $toReturn['salary'],
            $toReturn['commission']
        );
        $travel = Utils::calcTravelExpenses($decision->travel,
            $decision->per_diem,
            $rep->total_sales
        );
        $contests = $decision->contest_budget;
        $toReturn->put('sales_contest', $decision->contest_budget);
        $toReturn->put("expenses", $contests + $benefits + $travel);

        // contribution margin -- gross margin minus the direct expenses
        $toReturn->put("contributionMargin",
            $toReturn['sales'] * (1 - Constants::COST_OF_GOODS)
             - $toReturn['salary']
             - $toReturn['commission']
             - $toReturn['expenses']);

        // behavior (whether this rep has been led by the correct leadership behavior)
        if ($rep->leadership_behavior == $rep->correct_leadership_behavior) {
            $behavior = 1;
        } else if ($rep->leadership_behavior == $rep->incorrect_leadership_behavior) {
            $behavior = -1;
        } else {
            $behavior = 0;
        }

        $toReturn->put('behavior', $behavior);

        // market share: (rep's total sales) / (total sales in rep's territory)
        $totalSales = $rep->territories->reduce(function ($sum, $terr) {return $sum += $terr->total_sales;}, 0);
        if ($totalSales == 0) {
            $totalSales = 1;
        }

        $toReturn->put("marketShare", $rep->total_sales / $totalSales * 100);

        return $toReturn;
    }

    public function toArray()
    {
        return $this->reps->all();
    }
}

```

Finances.php
```php
<?php

namespace App\Models;

use App\Constants;
use App\Models\Company;
use App\Models\Simulation;
use App\OtherCompiler;
use App\Utils;
use DB;
use Illuminate\Database\Eloquent\Model;

class Finances extends Model
{
    /* helper functions */

    /**
     * Creates a new Finances object for the given company and date key
     *
     * @preconditions: assumes that sales for each territory have been calculated and saved
     *                 assumes that Finances don't already exist for this company/date key
     *
     * @param Company $company
     * @param string $date_key
     * @return Finances $finances (already saved)
     **/
    public static function initialize(
        Company $company,
        string $date_key,
        $territories,
        $previousReps,
        $currentReps,
        $salesDecision,
        $otherDecision
    ) {
        assert(!Finances::thisCompany($company->id)->current($date_key)->exists(), "Finances already exist!");

        // first, calculate some auxiliary information
        $pos = "rep" . $company->position;
        $total_sales = $territories->reduce(function ($total, $terr) use ($pos) {
            return $total + $terr->{"{$pos}_sales"};
        }, 0);
        $total_expenses = 0;
        $currentReps    = $currentReps->map(function ($rep) {return $rep->rep;});
        $previousReps = $previousReps->map(function ($rep) {return $rep->rep;});
        $numReps     = $currentReps->count();
        // todo: get these numbers from somewhere better than here
        // these counts aren't actually accurate (reps could be poached, force-hired, etc)
        $numNewHires = $currentReps->diff($previousReps)->count();
        $numFires    = $previousReps->diff($currentReps)->count();

        // build the decision
        $finances             = new Finances();
        $finances->company_id = $company->id;
        $finances->date_key   = $date_key;

        $finances->total_rep_salaries = ceil($salesDecision->salary * $numReps / 4);
        $finances->total_commissions  = ceil(($salesDecision->commission / 100) * $total_sales);
        $finances->total_benefits     = ceil(Utils::calcBenefitsExpenses($salesDecision->benefits,
            $salesDecision->salary / 4, $finances->total_commissions, $numReps));
        $finances->total_contest_budget = ceil($salesDecision->salesContestCost() * $salesDecision->numContestWinners());
        $finances->total_travel         = ceil(Utils::calcTravelExpenses($salesDecision->travel,
            $salesDecision->per_diem, $total_sales, $numReps));

        $finances->manager_commission = ceil($total_sales * Constants::MANAGER_COMMISSION);
        $finances->manager_benefits   = ceil(($finances->manager_commission + Constants::MANAGER_SALARY_QTR) * 0.2);

        $finances->training_expenses    = Constants::TRAINING_EXPENSES * $numNewHires;
        $finances->termination_expenses = Constants::TERMINATION_EXPENSES * $numFires;
        $finances->clerical_expenses    = Constants::CLERICAL_EXPENSES;
        $finances->rent_and_utilities   = ceil((rand(90, 110) / 100) * Constants::RENT_AND_UTILITIES + (rand(-1, 1) * 100));

        $finances->legal_and_other_expenses = ceil(Constants::LEGAL_AND_OTHER + $company->currentNotices($date_key)->sum('cost'));
        $finances->market_research_expense  = 0;
        if ($otherDecision['compensation_report'] == "1") {
            $finances->market_research_expense += Constants::COMPENSATION_REPORT_COST;
        }

        if ($otherDecision['salesrep_report'] == "1") {
            $finances->market_research_expense += Constants::SALESREP_REPORT_COST;
        }

        $finances->total_sales    = $total_sales;
        $finances->gross_margin   = $total_sales * (1 - Constants::COST_OF_GOODS);
        $finances->total_expenses = $finances->getDirectExpenses() + $finances->getOverheadExpenses();
        $finances->net_income     = $finances->gross_margin - $finances->total_expenses;

        $finances->save();
        return $finances;
    }

    /**
     * Converts the model to a collection and removes id + timestamps
     *
     * @return Collection $finances
     **/
    public function cleanForReport()
    {
        $unwanted = collect(['id', 'created_at', 'updated_at']);
        $toReturn = collect([]);

        foreach ($this->original as $label => $value) {
            if ($unwanted->contains($label)) {
                continue;
            }

            $toReturn->put($label, $value);
        }
        $toReturn['manager_salary'] = Constants::MANAGER_SALARY_QTR;
        $toReturn['manager_travel'] = Constants::MANAGER_TRAVEL_QTR;

        return $toReturn;
    }

    public function getDirectExpenses()
    {
        return $this->total_rep_salaries + $this->total_commissions
         + $this->total_benefits + $this->total_contest_budget
         + $this->total_travel;
    }

    public function getOverheadExpenses()
    {
        return $this->manager_commission + $this->manager_benefits
         + Constants::MANAGER_SALARY_QTR + Constants::MANAGER_TRAVEL_QTR 
         + $this->training_expenses
         + $this->termination_expenses + $this->clerical_expenses
         + $this->rent_and_utilities + $this->market_research_expense
         + $this->legal_and_other_expenses;
    }

    /**
     * Returns an array containing some brief financial information
     *
     * @return array ['type' => "other", "finances" => $finances]
     **/
    public function getBlurb()
    {
        // get sales, net profit, to date profit, current standing
        $blurb                   = [];
        $blurb["Sales"]          = $this->total_sales;
        $blurb["Net Income"]     = $this->net_income;
        $blurb["Income To Date"] = $this->company->finances()->toDate($this->date_key)->sum("net_income");
        $blurb["Current Rank"]   = $this->getRank();
        return ['type' => "other", "finances" => $blurb];
    }

    /**
     * Returns the company's ranking compared to other companies in industry
     *
     * @return int $standing
     **/
    public function getRank()
    {
        $companies = $this->company->getWholeIndustry();
        $earnings  = $companies->map(function ($c) {
            $profit = $c->finances()->toDate($this->date_key)->sum("net_income");
            return ["earnings_to_date" => $profit, "company_id" => $c->id];
        });
        $earnings = $earnings->sortBy('earnings_to_date')->reverse()->values()
            ->map(function ($f, $rank) {
                $f['rank'] = $rank + 1;
                return $f;
            });
        return $earnings->where('company_id', (int) $this->company_id)->values()[0]['rank'];
    }

    // this function can be safely ignored
    // it was for a time when we re-wrote the financial calculations mid-semester,
    // and wanted to update all calculations, even those of decisions already made
    public static function recalcAll()
    {
        DB::table('finances')->delete(); // Finances::delete() isn't working
        $compiler = new OtherCompiler();
        Simulation::get()->each(function ($sim) use ($compiler) {
            $prev      = Utils::previousDateKey($sim->current_qtr); // have to get previous bc if we're on a C2, that means Finances can't yet exist
            $date_keys = Utils::getPreviousC2DateKeys($prev);
            foreach ($sim->industries as $industry) {
                foreach ($date_keys as $date_key) {
                    $compiler->calcFinances($industry, $date_key);
                }
            }
        });
    }

    /* scopes */
    public function scopeThisCompany($query, $company_id = null)
    {
        if (is_null($company_id)) {
            $company_id = session('company_id');
        }

        assert(!is_null($company_id), 'Finances::scopeThisCompany(): company_id is null!');
        $query->where('company_id', $company_id);
    }

    public function scopeCurrent($query, $date_key = null)
    {
        if (is_null($date_key)) {
            $date_key = session('current_qtr');
        }

        assert(!is_null($date_key), 'Finances::scopeThisCompany(): date_key is null!');
        $query->where('date_key', $date_key);
    }

    public function scopePrevious($query, $date_key = null)
    {
        if (is_null($date_key)) {
            $date_key = session('current_qtr');
        }

        assert(!is_null($date_key), "session('current_qtr') is null!");

        $date_key = Utils::previousDateKey($date_key);
        $query->where('date_key', $date_key);
    }

    public function scopeToDate($query, $date_key = null)
    {
        if (is_null($date_key)) {
            $date_key = session('current_qtr');
        }

        assert(!is_null($date_key), 'Finances::scopeToDate(): date_key is null!');
        $query->where('date_key', '<=', $date_key);
    }

    /* relationships */
    public function company()
    {
        return $this->belongsTo('App\Models\Company');
    }
}

```
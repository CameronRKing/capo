```php
<?php

namespace App;

use App\Models\ActiveRep;
use App\Models\Company;
use App\Models\Firing;
use App\Models\Hiring;
use App\Models\Simulation;
use App\Models\Territory;
use App\Reports\HiringOutcomesReport;

class SalesCompiler
{
    public function compile(Simulation $sim)
    {
        $date_key    = $sim->current_qtr;
        $nextDateKey = Utils::nextDateKey($date_key);

        foreach ($sim->industries as $industry) {
            $industry->ensureDecisionsAreMade($date_key);

            // new reps must be created before territories
            $newReps = ActiveRep::createNewGroup($sim->id, $industry->id, $nextDateKey);
            Territory::createNewGroup($sim->id,
                $industry->id,
                $sim->state_id,
                $nextDateKey);

            $decisions = $industry->companies->map(function ($company) use ($date_key) {
                $decision = $company->salesDecisions()->current($date_key)->first();
                $decision->calcAttrIndex();
                return $decision;
            });
            $this->addNoticeForLeastAttractiveCompany($decisions);
            Firing::fireAll($decisions, $newReps);
            Hiring::hireAll($decisions, $newReps);

            $decisions->each(function($decision) use ($date_key) {
                $hiringOutcomes = new HiringOutcomesReport($decision->company_id, Utils::nextDateKey($date_key));
                HiringQuiz::generate($decision->company_id, $date_key, $decision, $hiringOutcomes);
            });
        }
    }

    public function addNoticeForLeastAttractiveCompany($decisions)
    {
        assert($decisions->count() == 4);
        assert($decisions->every(function ($d) {return isset($d->attrIndex);}) == true);

        $decisions->sortBy('attrIndex')
            ->first()->company
            ->addLeastAttractiveNotice($decisions->first()->date_key);
    }
}
```
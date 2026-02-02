```php

public static function hireAll($decisions, $newReps)
{
    $attrIndices = $decisions->mapWithKeys(function ($d) {return [$d->company_id => $d->attrIndex];});

    $decisions->sortByDesc('attrIndex')
        ->each(function ($decision) use ($newReps, $attrIndices) {
            $hireList = $decision->hiring;
            $hireIdx  = 0;

            for ($i = 0; $i < $decision->num_to_hire; $i++) {
                $success = false;
                // try to hire the next rep
                while (!$success && $hireIdx < $hireList->count()) {
                    $toHire  = $hireList[$hireIdx++];
                    $success = self::tryToHire($decision->company_id, $toHire, $newReps, $attrIndices);
                }
            }
        });
}

public static function tryToHire($companyId, $toHire, $newReps, $attrIndices)
{
    $prospect = $newReps->first(function ($rep) use ($toHire) {
        return $rep->rep_id == $toHire->id;
    });

    if (isset($prospect->hasBeenSelected)) {
        return false;
    }

    if (is_null($prospect->company)) {
        $prospect->company()->associate($companyId)->save();
        $prospect->hasBeenSelected = true;
        return true;
    }

    $numReps = $newReps->where('company_id', $prospect->company_id)->count();
    if ($attrIndices[$companyId] > $attrIndices[$prospect->company_id]
        && $numReps > Constants::MIN_REPS
        && $prospect->canBePoached()) {
        $prospect->company()->associate($companyId)->save();
        $prospect->hasBeenSelected = true;
        return true;
    }

    // couldn't make the hire
    return false;
}

// ...
// within ActiveRep.php
public function canBePoached()
{
    // can't poach during first decision
    if ($this->date_key <= "Y1Q1C2") {
        return false;
    }

    // no need to check Y0Q4C2 since they can't be poached,
    // so we can start by checking Y1Q2C2
    $prevDate = max("Y1Q1C2", Utils::previousYear($this->date_key));
    return ActiveRep::where([
        ['rep_id', $this->rep_id],
        ['industry_id', $this->industry_id],
        ['date_key', '<', $this->date_key],
        ['date_key', '>=', $prevDate],
    ])
        ->get()
        ->filter(function ($r) {return $r->wasPoached();})
        ->isEmpty();

}

public function wasPoached()
{
    if (is_null($this->company)) {
        return false;
    }
    $salesKey = Utils::previousDateKey($this->date_key);
    $salesDecision = $this->company->salesDecisions()->current($salesKey)->first();
    assert(!is_null($salesDecision));
    $wasFired = $salesDecision->firing->contains(function ($f) {return $f->rep_id == $this->rep_id;});

    $nextRep = ActiveRep::where([
        ['rep_id', $this->rep_id],
        ['industry_id', $this->industry_id],
        ['date_key', Utils::nextQuarter($this->date_key)],
    ])->first();
    assert(!is_null($nextRep));
    $wasRehired = $nextRep->company_id != $this->company_id;

    return $wasRehired && !$wasFired;
}
```
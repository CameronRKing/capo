```php
<?php

namespace App;

use DB;
use App\Models\{Company, Salesrep};

/**
  * Combines the individual rep rankings of students in a given company into a single consistent list
  *
  * Uses a modified Borda count
  * Ties are broken alphabetically
  */
class RepRankingCombiner
{
    private $company;

    public function __construct(Company $company)
    {
        $this->company = $company;
    }

    public function combine()
    {
        $userRankings = DB::table('rep_rankings')
            ->where('company_id', $this->company->id)
            ->get()
            ->groupBy('user_id')
            ->map(function($userRanking) {
                return $this->scoreReps($userRanking);
            });

        return $this->combineRankings($userRankings)
            ->map(function ($data) {
                return $data['rep']->rep_id;
            });
    }

    public function scoreReps($reps)
    {
        return $reps
            ->sortBy(function($rep) {
                return (int)$rep->rank + ['A' => 0, 'B' => 100, 'C' => 200, '' => 300][$rep->group];
            })
            ->values()
            ->mapWithKeys(function($rep, $idx) {
                return [$rep->rep_id => [
                    'rep' => $rep,
                    'score' => (70 - $idx) / 70
                ]];
            });
    }

    public function combineRankings($repRankings)
    {
        return $repRankings->reduce(function ($combined, $repRanking) {
                if ($combined->isEmpty()) {
                    // copying the data instead of returning it directly
                    return $repRanking->map(function($r) {
                        return ['rep' => $r['rep'], 'score' => $r['score']];
                    });
                }

                return $repRanking->reduce(function ($carry, $data) {
                    $id = $data['rep']->rep_id;
                    // gotta do this indirection or else I get told that 'Indirect modification of overloaded elements has no effect'
                    $rep = $carry[$id];
                    $rep['score'] += $data['score'];
                    $carry[$id] = $rep;
                    return $carry;
                }, $combined);
            }, collect())
            ->sort(function ($left, $right) {
                if ($left['score'] == $right['score']) {
                    return Salesrep::find($left['rep']->rep_id)->name < Salesrep::find($right['rep']->rep_id)->name ? -1 : 1;
                }
                return $left['score'] < $right['score'] ? 1 : -1;
            })
            ->values();
    }
}
```
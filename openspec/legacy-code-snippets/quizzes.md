BaseQuiz.php
```php
<?php

namespace App;

use DB;

class BaseQuiz {
    protected $companyId;
    protected $dateKey;

    public function __construct($companyId, $dateKey) {
        $this->companyId = $companyId;
        // the date key given should be the one that the quiz is over
        // however, the quiz itself is taken in the next stage, so we advance the key
        $this->dateKey = Utils::nextDateKey($dateKey);
    }

    protected function questionGroups() {
        return [];
    }

    protected function generateAndSaveQuestions() {
        srand($this->companyId + $this->dateKey[1] + $this->dateKey[3] + $this->dateKey[5]);

        $this->questionGroups()
            ->map(function($group) {
                return $this->chooseOne($group);
            })
            ->each(function ($question) {
                $this->saveQuestion($question);
            });
    }

    protected function chooseOne($group) {
        return $group[rand(0, $group->count() - 1)];
    }

    protected function saveQuestion($question) {
        DB::table('quiz_questions')->insert([
            'company_id' => $this->companyId,
            'date_key' => $this->dateKey,
            'prompt' => $question['prompt'],
            'correct_answer' => $question['correct_answer']
        ]);
    }
}
```

HiringQuiz.php
```php
<?php

namespace App;

class HiringQuiz extends BaseQuiz {
    static function generate($companyId, $dateKey, $decision, $outcomes) {
        $quiz = new HiringQuiz(
            $companyId,
            $dateKey,
            $decision,
            $outcomes
        );

        $quiz->generateAndSaveQuestions();
    }

    private $decision;
    private $outcomes;

    public function __construct($companyId, $dateKey, $decision, $outcomes) {
        parent::__construct($companyId, $dateKey);
        $this->decision = $decision;
        $this->outcomes = $outcomes;    
    }

    protected function questionGroups() {
        return collect([
            // first group
            [
                ['prompt' => 'In your most recent job offer, what was your annual salary?','correct_answer' => $this->decision->salary],
                ['prompt' => 'In your most recent job offer, what was your rate of commission?', 'correct_answer' => $this->decision->commission],
            ],
            // second group
            [
                ['prompt' => 'How many people did you hire this quarter?', 'correct_answer' => $this->decision->num_to_hire],
                ['prompt' => 'How many members of your old sales team were poached this quarter?', 'correct_answer' => $this->numRepsPoached()],
                ['prompt' => 'How many account mannagers are on your current (i.e., new) sales team?', 'correct_answer' => $this->sizeOfNewSalesTeam()]
            ],
            // third group
            [
                ['prompt' => 'In your most recent job offer, what percent of time did you spend on product knowledge?', 'correct_answer' => $this->decision->product_knowledge],
                ['prompt' => 'In your most recent job offer, what percent of time did you spend on market-industry orientation?', 'correct_answer' => $this->decision->market_orientation],
                ['prompt' => 'In your most recent job offer, what percent of time did you spend on company orientation?', 'correct_answer' => $this->decision->company_orientation],
                ['prompt' => 'In your most recent job offer, what percent of time did you spend on selling techniques?', 'correct_answer' => $this->decision->selling_techniques],
            ]
        ])->map(function($group) { return collect($group); });
    }

    private function numRepsPoached() {
        return $this->outcomes->oldRepOutcomes
            ->filter(function($outcome) {
                return $outcome['outcome'] === 'poached';
            })->count();
    }

    private function sizeOfNewSalesTeam() {
        return $this->outcomes->newRepOutcomes->count();
    }
}
```

LeadershipQuiz.php
```php
<?php

namespace App;

class TerritoryQuiz extends BaseQuiz {
    public static function generate($companyId, $dateKey, $finances, $repReport) {
        $quiz = new TerritoryQuiz($companyId, $dateKey, $finances, $repReport);

        $quiz->generateAndSaveQuestions();   
    }

    private $finances;
    private $repReport;

    public function __construct($companyId, $dateKey, $finances, $repReport) {
        parent::__construct($companyId, $dateKey);
        $this->finances = $finances;
        $this->repReport = $repReport;
    }



    protected function questionGroups() {
        return collect([
            [
                ['prompt' => 'Which company generated the most income in the most recent quarter (NOT income to date)? (Aromatics = 1, Bioscent = 2, Candelarium = 3, Dynowick = 4)', 'correct_answer' => $this->getTopCompany()]
            ],
            [
                ['prompt' => 'What current position is your company in (based on income to date)?', 'correct_answer' => $this->getCurrentPosition()]
            ],
            [
                ['prompt' => 'For how many account managers are you exhibiting the correct leader behavior? (i.e., how many smiley faces are there?)', 'correct_answer' => $this->countSmileyFaces()],
                ['prompt' => 'How much total money has your company spent on salesperson contests for this past quarter?', 'correct_answer' => $this->getTotalSalesContestExpense()],
                ['prompt' => 'Which one of your account managers generated the greatest contribution margin this past quarter?', 'correct_answer' => $this->getAcctMgrWithGreatestContribution()],
                ['prompt' => 'Which one of your account managers has the greatest workload this past quarter?', 'correct_answer' => $this->repWithGreatestWorkload()]
            ],
        ])->map(function($group) { return collect($group); });
    }

    private function getTopCompany() {
        $maxNetIncome = $this->finances->max('net_income');
        return $this->finances->first(function($finance) use ($maxNetIncome) {
            return $finance->net_income == $maxNetIncome;
        })->company->position;
    }

    private function getCurrentPosition() {
        return $this->finances->where('company_id', $this->companyId)->first()->getRank();
    }

    private function countSmileyFaces() {
        return $this->repReport->reps->where('behavior', 1)->count();
    }

    private function getTotalSalesContestExpense() {
        return $this->repReport->reps->sum('sales_contest');
    }

    private function getAcctMgrWithGreatestContribution() {
        $maxContribution = $this->repReport->reps->max('contributionMargin');
        return $this->repReport->reps->where('contributionMargin', $maxContribution)->first()['name'];
    }

    private function repWithGreatestWorkload() {
        $maxWorkload = $this->repReport->reps->max('workload');
        return $this->repReport->reps->where('workload', $maxWorkload)->first()['name'];
    }
}
```

Essay Questions, which are served with the generated quizzes, but treated somewhat separately
```php
<?php

namespace App;

use DB;

class EssayQuestion {
    public static function generateIfNeeded($simId, $dateKey) {
        $essay = new EssayQuestion($simId, $dateKey);

        if ($essay->getQuestion()) return;

        $essay->generateDefaultQuestion();
    }

    private $simId;
    private $dateKey;

    public function __construct($simId, $dateKey) {
        $this->simId = $simId;
        $this->dateKey = $dateKey;
    }

    public function getQuestion() {
        return DB::table('essay_questions')
            ->where([
                ['simulation_id', $this->simId],
                ['date_key', $this->dateKey]
            ])->first();
    }

    public function generateDefaultQuestion() {
        DB::table('essay_questions')
            ->insert([
                'simulation_id' => $this->simId,
                'date_key' => $this->dateKey,
                'prompt' => $this->getDefaultPrompt(),
            ]);

        return $this->getQuestion();
    }

    private function getDefaultPrompt() {
        $stage = $this->dateKey[5];

        $userDefault = $this->getUserDefaultPrompt($stage);

        return $userDefault ?
            $userDefault->prompt :
            $this->getGameDefaultPrompt($stage);
    }

    private function getUserDefaultPrompt($stage) {
        return DB::table('default_essay_questions')->where([
            ['simulation_id', $this->simId],
            ['stage', $stage]
        ])->first();
    }

    private function getGameDefaultPrompt($stage) {
        return [
            1 => "What is your opinion about your company's strategy for the next set of decisions?",
            2 => "What is your opinion about your company's strategy for the next set of decisions?",
        ][$stage];
    }
}
```

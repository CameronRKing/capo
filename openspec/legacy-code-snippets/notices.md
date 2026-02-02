Base (Abstract) Class
```php
<?php

namespace App\Notices;

/**
 * What's going on here?
 *
 * I wanted a meaningful way to access different types of notices without having to fudge around with models on a low level
 * Additionally, I wanted to save the relevant info to each notice in the database. Might be a bad idea, but it's how I did the leadership behaviors.
 * If there's a better way, I don't know it at the moment.
 * Thought about putting the info in different classes but it got repetitive, and I don't like keeping presentation info with logic.
 * Plus, putting the info in different classes decentralizes it a little.
 *
 * I wanted a way to alias different underlying instances of a Notice model with meaningful names. Subclassing was an option, but I couldn't create
 * new objects easily. I could as long as the subclass CONTAINED a Notice instead of BEING a notice, but I didn't want composition.
 * I want to treat the object I get back as a Notice itself, not something that has a Notice.
 * The singleton pattern allows me to access a single underlying Notice instance without any of the other problems.
 *
 * Originally each subclass managed its own instance, but the code was repeated in every class with the only difference being the class name.
 * Seems like a good use case for a superclass function, don't you think?
 *
 * Really, the only thing that the Notice subclasses add is a way to alias the different kinds of Notices.
 * I'm sure there's a better, less confusing way to do this, but I don't know what it is.
 **/

class AbstractNotice
{
    private static $instances = [];

    public static function getInstance()
    {
        // class name is namespaced, e.g., App\Notices\AllMaleNotice
        // we want only the last piece of the full name
        $class = explode("\\", get_called_class())[2];
        if (!isset(self::$instances[$class])) {
            self::$instances[$class] = \App\Models\Notice::where('class', $class)->first();
        }

        return self::$instances[$class];
    }
}
```

All the various kinds of notices
```php
<?php

namespace App\Notices;

class AllMaleNotice extends AbstractNotice
{
    public static function check($reps, $sim_id)
    {
        return $reps->contains(function ($r) {return $r->gender == "F";}) ? null : self::getInstance();
    }
}
```
```php
<?php

namespace App\Notices;

class AntitrustNotice extends AbstractNotice
{
    public static function check($reps, $sim_id)
    {
        return $reps->contains(function ($r) use ($sim_id){return $r->name == "Bristol O'Callahan Sr.";}) ? self::getInstance() : null;
    }
}
```
```php
<?php

namespace App\Notices;

class BriberyNotice extends AbstractNotice
{
    public static function check($reps, $sim_id)
    {
        return $reps->contains(function ($r) use ($sim_id){return $r->name == "Melanie Harrison";}) ? self::getInstance() : null;
    }
}
```
```php
<?php

namespace App\Notices;

class FakeNewsNotice extends AbstractNotice
{
    public static function check($reps, $sim_id)
    {
        return $reps->contains(function ($r) use ($sim_id){return $r->name == "Heather Marowick";}) ? self::getInstance() : null;
    }
}
```
```php
<?php

namespace App\Notices;

class FighterFitzgeraldNotice extends AbstractNotice
{
    public static function check($reps, $sim_id)
    {
        return $reps->contains(function ($r) use ($sim_id){return $r->name == "Fitzgerald St. James";}) ? self::getInstance() : null;
    }
}
```
```php
<?php

namespace App\Notices;

class ForgotTerritoryDecisionsNotice extends AbstractNotice
{}
```
```php
<?php

namespace App\Notices;

use App\Models\SalesDecision;

class InadequateProductTrainingNotice extends AbstractNotice
{
    public static function check(SalesDecision $decision)
    {
        return $decision->product_knowledge >= 25 ? null : self::getInstance();
    }
}
```

```php
<?php

namespace App\Notices;

use App\Models\SalesDecision;

class InadequateSellingTrainingNotice extends AbstractNotice
{
    public static function check(SalesDecision $decision)
    {
        return $decision->selling_techniques >= 30 ? null : self::getInstance();
    }
}
```

```php
<?php

namespace App\Notices;

class LeastAttractiveNotice extends AbstractNotice
{}
```

```php
<?php

namespace App\Notices;

use App\Models\SalesDecision;

class LowPerDiemNotice extends AbstractNotice
{
    public static function check(SalesDecision $decision)
    {
        return ($decision->travel != 2 || $decision->per_diem >= 200) ? null : self::getInstance();
    }
}
```

```php
<?php

namespace App\Notices;

class NoMinoritiesNotice extends AbstractNotice
{
    public static function check($reps, $sim_id, $notices)
    {
        return $reps->every(function ($r) {return $r->is_minority == 0;})
        && $notices->contains(function ($n) {return $n->class == "NoMinoritiesWarning";})
        ? self::getInstance() : null;
    }
}
```

```php
<?php

namespace App\Notices;

class NoMinoritiesWarning extends AbstractNotice
{
    public static function check($reps, $sim_id, $notices)
    {
        return $reps->every(function ($r) {return $r->is_minority == 0;})
        && !$notices->contains(function ($n) {return $n->class == "NoMinoritiesWarning";})
        ? self::getInstance() : null;
    }
}
```

```php
<?php

namespace App\Notices;

use App\Models\SalesDecision;

class OwnExpensesNotice extends AbstractNotice
{
    public static function check(SalesDecision $decision)
    {
        return $decision->travel != 3 ? null : self::getInstance();
    }
}
```

```php
<?php

namespace App\Notices;

class SexualHarasserNotice extends AbstractNotice
{
    public static function check($reps, $sim_id)
    {
        return $reps->contains(function ($r) use ($sim_id){return $r->name == "Ralph Wilkins";}) ? self::getInstance() : null;
    }
}
```

```php
<?php

namespace App\Notices;

use App\Models\SalesDecision;

class SteakKnifeNotice extends AbstractNotice
{
    public static function check(SalesDecision $decision)
    {
        return $decision->sales_contest == '1' ? self::getInstance() : null;
    }
}
```

The code that glues them all together:
```php
<?php

namespace App\Notices;

class Notices
{
    const ACCT_MGR_NOTICES = [
        AllMaleNotice::class,
        NoMinoritiesWarning::class,
        NoMinoritiesNotice::class,
        SexualHarasserNotice::class,
        FighterFitzgeraldNotice::class,
        BriberyNotice::class,
        FakeNewsNotice::class,
        AntitrustNotice::class,
    ];

    const DECISION_NOTICES = [
        InadequateProductTrainingNotice::class,
        InadequateSellingTrainingNotice::class,
        OwnExpensesNotice::class,
        LowPerDiemNotice::class,
        SteakKnifeNotice::class,
    ];

    public static function checkAll($reps, $salesDecision, $notices, $sim_id)
    {
        $notices = self::checkAcctMgrs($reps, $notices, $sim_id);
        return $notices->merge(self::checkSalesDecisions($salesDecision));
    }

    public static function checkAcctMgrs($reps, $notices, $sim_id)
    {
        return self::checkFor(self::ACCT_MGR_NOTICES, [$reps, $sim_id, $notices]);
    }

    public static function checkSalesDecisions($decision)
    {
        return self::checkFor(self::DECISION_NOTICES, [$decision]);
    }

    public static function checkFor($classes, $argsArray)
    {
        $notices = collect();
        foreach ($classes as $class) {
            if ($notice = call_user_func([$class, 'check'], ...$argsArray)) {
                $notices[] = $notice;
            }
        }
        return $notices;
    }
}
```

On reflection, this data doesn't need to be in the database--it can exist just fine hard-coded into the system. It has never been changed in the last eigtht years.

But for reference, here's the database seeder that provides the messages and costs for each notice:
```php
<?php

use Illuminate\Database\Seeder;

class NoticesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $notices = [
            [
                'class'   => 'AllMaleNotice',
                'message' => 'BAD NEWS!  Stemming from the fact that all of your account managers are male, a discrimination lawsuit has been filed against your firm.  You have settled the case with a payout of ${cost}.  This expense is listed in your detailed finances income statement in the LEGAL AND OTHER EXPENSES category.',
                'cost'    => 35000,
            ], [
                'class'   => 'FighterFitzgeraldNotice',
                'message' => 'BAD NEWS!  One of your account managers, Fitzgerald St. James, got into a fist fight with a customer –and this was not his first time!  The customer sued your company, and you settled the lawsuit for ${cost}.  This expense is listed in your detailed finances income statement in the LEGAL AND OTHER EXPENSES category.',
                'cost'    => 30000,
            ], [
                'class'   => 'InadequateProductTrainingNotice',
                'message' => 'BAD NEWS!  One of your newer account managers was inadequately trained about the potential side effects that one of your aromatherapy products had on customers with asthma.  A lawsuit was filed by one of these customers, and this resulted in your company paying a ${cost} settlement.  This expense is listed in your detailed finances income statement in the LEGAL AND OTHER EXPENSES category.  More product training is needed!',
                'cost'    => 20000,
            ], [
                'class'   => 'InadequateSellingTrainingNotice',
                'message' => 'BAD NEWS!  An IRS audit discovered that several of your account managers have been found to be cheating on their expense reports!  This leads to tax fraud, as it is inappropriate to deduct bogus expenses when filing taxes.  A fine of ${cost} has been paid by your firm.  This expense is listed in your detailed finances income statement in the LEGAL AND OTHER EXPENSES category.  More training time should be devoted to proper selling techniques, so this doesn’t happen again!',
                'cost'    => 30000,
            ], [
                'class'   => 'NoMinoritiesNotice',
                'message' => 'BAD NEWS!  Stemming from the fact that none of your account managers is a minority, a discrimination lawsuit has been filed against your firm.  You have settled the case with a payout of ${cost}.  This expense is listed in your detailed finances income statement in the LEGAL AND OTHER EXPENSES category.',
                'cost'    => 25000,
            ], [
                'class'   => 'NoMinoritiesWarning',
                'message' => 'WARNING!  Stemming from the fact that none of your account managers is a minority, a discrimination lawsuit is being prepared against your firm.  It will go to court next quarter unless you hire a minority.',
                'cost'    => 0,
            ], [
                'class'   => 'SexualHarasserNotice',
                'message' => 'BAD NEWS!  One of your account managers, Ralph Wilkins, was found to have sexually harassed a colleague.  Your firm was liable because the court ruled that the sales manager should have known about this, yet did nothing to stop it.  Total cost to deal with this is ${cost}.  This expense is listed in your detailed finances income statement in the LEGAL AND OTHER EXPENSES category.',
                'cost'    => 30000,
            ], [
                'class'   => 'OwnExpensesNotice',
                'message' => 'MORALE PROBLEM! Several of your account managers are complaining that they have to pay for their own expenses.',
                'cost'    => 0,
            ], [
                'class'   => 'LowPerDiemNotice',
                'message' => 'MORALE PROBLEM! Your per diem is especially low, and has resulted in lots of complaints to the company president. In fact, the president has ordered you to lift morale by hosting a “morale-building” weekend in the state capital for all account managers and guests. This is costing your sales organization ${cost}. This expense is listed in your detailed finances income statement in the LEGAL AND OTHER EXPENSES category.',
                'cost'    => 30000,
            ], [
                'class'   => 'BriberyNotice',
                'message' => 'BAD NEWS! One of your account managers, Melanie Harrison, was caught trying to bribe a customer. She offered the candle shop owner $500 cash (under the table) to make a big purchase. This illegal activity was reported; and is costing you ${cost} in legal fees. This expense is listed in your detailed finances income statement in the LEGAL AND OTHER EXPENSES category.',
                'cost'    => 30000,
            ], [
                'class'   => 'FakeNewsNotice',
                'message' => 'BAD NEWS! A competitor has reported that one of your account managers, Heather Marowick, has been dishonestly disparaging their products. She has been lying about side effects, and using a fake news story to bolster her claims. This is illegal, and has cost your company ${cost} settle. This expense is listed in your detailed finances income statement in the LEGAL AND OTHER EXPENSES category.',
                'cost'    => 25000,
            ], [
                'class'   => 'AntitrustNotice',
                'message' => 'BAD NEWS! A competitor has reported that one of your account managers, Bristol O\'Callahan Sr., has been pressuring its retailer-customers to buy exclusively from your company. He is promising that if the retailers do this, then he will ensure that the customer gets a continuous and abundant supply of your hard-to-get, top selling product. This is an illegal violation of anti-trust laws, and so your company has been fined ${cost}. This expense is listed in your detailed finances income statement in the LEGAL AND OTHER EXPENSES category.',
                'cost'    => 25000,
            ], [
                'class'   => 'ForgotTerritoryDecisionsNotice',
                'message' => 'BAD NEWS! Your company forgot to submit the sales management decisions for the most recent quarter, and this has caused problems with the state regulatory commission that authorizes you to sell this product. The commission has fined you ${cost}. This expense is listed in your detailed finances income statement in the LEGAL AND OTHER EXPENSES category.',
                'cost'    => 100000,
            ], [
                'class'   => 'LeastAttractiveNotice',
                'message' => 'MORALE PROBLEM! Word on the street is that your company is the least attractive of the four Cantopia companies. To become more attractive, you should increase aspects of your job offer – or at least spend more time recruiting.',
                'cost'    => 0,
            ], [
                'class'   => 'SteakKnifeNotice',
                'message' => 'NOTICE: Your sales contest did not work out. Upon the announcement of the winner, a violent argument erupted among several members of your sales team, and one account manager was lightly stabbed in the forearm by a steak knife (but fortunately it was just a flesh wound). In the end, this disturbance cost your first ${cost} in medical bills and lawsuits. General consensus was that the steak knives prize was a bad idea.',
                'cost'   => 80000,
            ],
        ];

        \DB::table('notices')->insert($notices);
    }
}
```
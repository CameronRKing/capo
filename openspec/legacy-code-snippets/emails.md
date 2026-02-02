These are all Laravel Blade templates.

The email that is sent to a student when their instructor adds them to a game, inviting them to join and pay (the "invitation email"):
```php
<!DOCTYPE html>
<html>
<head>
    <title>Registration</title>
</head>
<body>
    <p>
        Your teacher, {{ $sim->teacherAccount->name }} has indicated that you are on the roster for their class, {{ $sim->class }}. 
        This class is using the Cantopia Sales Force Management Simulation Game.
    </p>
    <p>
        The simulation costs ${{ number_format(env('STRIPE_COST_IN_CENTS') / 100, 2) }}. You can register for the game and pay
        <a href="{{ url("/register?email=" . $student->email) }}">here</a>.
        <b>Make sure that you use this email account to register! (If you have already created an account with this email, you don't need to create a new one. Just login using your existing information.)</b>
        Your teacher has attached this email account to the simulation, which means that 
        you will not be able to enter the game with another email!
    <p>
    <p>
        Once you've registered and paid, the manual should be able to answer all of your questions.
        Happy selling!
    </p>
</body>
</html>
```

The email that is sent to an instructor when their account request is approved (the "welcome email"):
```php
<!DOCTYPE html>
<html>
<head>
    <title>Welcome</title>
</head>
<body>
    <p>
        Welcome to Cantopia! A teacher's account has been created for you. You can now create and manage simulations! 
        To help you get the lay of the land, we've given you a test simulation to play with. 
    </p>
    <p>
        You can log in <a target="_blank" href="www.cantopiasimulation.com/login">here.</a>
        You will be prompted to change your password when you log in.
    </p>
    <br />
    <p><b>Your login information:</b></p>
    <ul>
        <li>Email: <b>{{ $email }}</b></li>
        <li>Password: <b>{{ $password }}</b></li>
    </ul>
</body>
</html>
```


This email is sent to game administrators when a new teacher account request is submitted:
```php
<!DOCTYPE html>
<html>
<head>
    <title>New Teacher Request</title>
</head>
<body>
    <p>Name: {{ $data['name'] }}</p>
    <p>Email: {{ $data['email'] }}</p>
    <p>School: {{ $data['school'] }}</p>
    <p>How they heard about us: {{ $data['how'] }}</p>
</body>
</html>
```


This email is sent when an instructor attempts to compile a game, the game notices that there are companies with unmade decisions, and the instructor chooses to send a reminder email rather than proceed by making default decisions:
```php
<!DOCTYPE html>
<html>
<head>
    <title>Reminder</title>
</head>
<body>
    <p>
        Your teacher just attempted to compile their simulation. 
        Your company has not made any decisions for the current period!
    </p> 
    <p>
        <a href="{{ url('/login') }}">Log in and make your decisions 
        @if ($dueDate)
            by {{ $dueDate }}!
        @else
            ASAP!
        @endif
        </a>
    </p>
</body>
</html>
```
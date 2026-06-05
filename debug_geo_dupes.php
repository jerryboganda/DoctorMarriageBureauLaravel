<?php

use App\Models\Country;
use App\Models\State;
use Illuminate\Contracts\Console\Kernel;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$pakistans = Country::where('name', 'LIKE', '%Pakistan%')->get();
echo 'Found '.$pakistans->count()." countries matching 'Pakistan':".PHP_EOL;
foreach ($pakistans as $p) {
    echo 'ID: '.$p->id.', Code: '.$p->code.', Name: '.$p->name.PHP_EOL;
    echo 'States count: '.State::where('country_id', $p->id)->count().PHP_EOL;
}

$allCountries = Country::all();
$pk_codes = $allCountries->where('code', 'PK');
echo "Countries with code 'PK': ".$pk_codes->count().PHP_EOL;
foreach ($pk_codes as $p) {
    echo 'ID: '.$p->id.', Name: '.$p->name.PHP_EOL;
}

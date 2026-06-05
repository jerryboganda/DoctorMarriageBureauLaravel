<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\Caste;
use App\Models\FamilyValue;
use App\Models\MaritalStatus;
use App\Models\MemberLanguage;
use App\Models\Religion;
use Illuminate\Contracts\Console\Kernel;

echo 'Seeding Religions...'.PHP_EOL;
$religions = [
    ['id' => 1, 'name' => 'Hindu'],
    ['id' => 2, 'name' => 'Muslim'],
    ['id' => 3, 'name' => 'Christian'],
    ['id' => 4, 'name' => 'Sikh'],
    ['id' => 5, 'name' => 'Buddhist'],
    ['id' => 6, 'name' => 'Jain'],
    ['id' => 7, 'name' => 'Parsi'],
    ['id' => 8, 'name' => 'Jewish'],
    ['id' => 9, 'name' => 'Bahai'],
    ['id' => 10, 'name' => 'Other'],
];

foreach ($religions as $religion) {
    Religion::updateOrCreate(['id' => $religion['id']], ['name' => $religion['name']]);
}

echo 'Seeding Castes...'.PHP_EOL;
$castes = [
    ['religion_id' => 1, 'name' => 'Brahmin'],
    ['religion_id' => 1, 'name' => 'Kshatriya'],
    ['religion_id' => 1, 'name' => 'Vaishya'],
    ['religion_id' => 1, 'name' => 'Shudra'],
    ['religion_id' => 1, 'name' => 'Rajput'],
    ['religion_id' => 1, 'name' => 'Maratha'],
    ['religion_id' => 1, 'name' => 'Reddy'],

    ['religion_id' => 2, 'name' => 'Sunni'],
    ['religion_id' => 2, 'name' => 'Shia'],
    ['religion_id' => 2, 'name' => 'Arain'],
    ['religion_id' => 2, 'name' => 'Rajput'],
    ['religion_id' => 2, 'name' => 'Jat'],
    ['religion_id' => 2, 'name' => 'Syed'],
    ['religion_id' => 2, 'name' => 'Sheikh'],
    ['religion_id' => 2, 'name' => 'Gujjar'],
    ['religion_id' => 2, 'name' => 'Pathan'],
    ['religion_id' => 2, 'name' => 'Memon'],
    ['religion_id' => 2, 'name' => 'Qureshi'],
    ['religion_id' => 2, 'name' => 'Ansari'],
    ['religion_id' => 2, 'name' => 'Malik'],
    ['religion_id' => 2, 'name' => 'Butt'],
    ['religion_id' => 2, 'name' => 'Other'],
];

foreach ($castes as $caste) {
    Caste::updateOrCreate(
        ['religion_id' => $caste['religion_id'], 'name' => $caste['name']],
        ['name' => $caste['name']]
    );
}

echo 'Seeding Marital Statuses...'.PHP_EOL;
$maritalStatuses = ['Single', 'Divorced', 'Widowed', 'Awaiting Divorce', 'Annulled'];
foreach ($maritalStatuses as $status) {
    MaritalStatus::updateOrCreate(['name' => $status], ['name' => $status]);
}

echo 'Seeding Family Values...'.PHP_EOL;
$familyValues = ['Traditional', 'Moderate', 'Liberal', 'Spiritual', 'Religious'];
foreach ($familyValues as $value) {
    FamilyValue::updateOrCreate(['name' => $value], ['name' => $value]);
}

echo 'Seeding Languages...'.PHP_EOL;
$languages = ['Urdu', 'English', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi', 'Seraiki', 'Hindko', 'Brahui', 'Other'];
foreach ($languages as $lang) {
    MemberLanguage::updateOrCreate(['name' => $lang], ['name' => $lang]);
}

echo 'Seeding completed successfully.'.PHP_EOL;

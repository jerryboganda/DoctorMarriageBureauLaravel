<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\Caste;
use App\Models\Country;
use App\Models\MaritalStatus;
use App\Models\MemberLanguage;
use App\Models\ProfileOptionValue;
use App\Models\Religion;
use Illuminate\Contracts\Console\Kernel;

function optionGroup(string $group): array
{
    return ProfileOptionValue::where('group', $group)
        ->where('is_active', true)
        ->orderBy('sort_order')
        ->get(['value', 'label'])
        ->map(function ($item) {
            return [
                'value' => $item->value,
                'label' => $item->label,
            ];
        })
        ->values()
        ->toArray();
}

$optionSets = [
    'genders' => optionGroup('gender'),
    'marriageTimeline' => optionGroup('marriage_timeline'),
    'relocationWillingness' => optionGroup('relocation_willingness'),
    'seriousnessLevel' => optionGroup('seriousness_level'),
    'dietOptions' => optionGroup('diet'),
    'drinkOptions' => optionGroup('drink'),
    'smokeOptions' => optionGroup('smoke'),
    'livingWithOptions' => optionGroup('living_with'),
    'sleepScheduleOptions' => optionGroup('sleep_schedule'),
    'workLocationOptions' => optionGroup('work_location_type'),
    'familyTypeOptions' => optionGroup('family_type'),
    'immigrationStatusOptions' => optionGroup('immigration_status'),
    'personalityTags' => optionGroup('personality_tags'),
    'personalValues' => optionGroup('personal_values'),
    'communityValues' => optionGroup('community_values'),
    'maritalStatuses' => MaritalStatus::orderBy('name')->get(['id', 'name'])->map(function ($item) {
        return [
            'id' => $item->id,
            'name' => $item->name,
        ];
    })->values()->toArray(),
    'religions' => Religion::orderBy('name')->get(['id', 'name'])->map(function ($item) {
        return [
            'id' => $item->id,
            'name' => $item->name,
        ];
    })->values()->toArray(),
    'castes' => Caste::orderBy('name')->get(['id', 'name', 'religion_id'])->map(function ($item) {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'religion_id' => $item->religion_id,
        ];
    })->values()->toArray(),
    'languages' => MemberLanguage::orderBy('name')->get(['id', 'name'])->map(function ($item) {
        return [
            'id' => $item->id,
            'name' => $item->name,
        ];
    })->values()->toArray(),
    'countries' => Country::where('status', 1)->orderBy('name')->get(['id', 'name', 'code'])->map(function ($item) {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'code' => $item->code,
        ];
    })->values()->toArray(),
];

foreach ($optionSets as $key => $values) {
    echo "$key: ".count($values)."\n";
}

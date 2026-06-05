<?php

$filePath = 'routes/api.php';
$content = file_get_contents($filePath);

// 1. Move Dropdown routes
$dropdownRoutes = <<<'EOD'
            Route::get('/maritial-status', 'ProfileDropdownController@maritial_status');
            Route::get('/countries', 'ProfileDropdownController@country_list');
            Route::get('/states/{id}', 'ProfileDropdownController@state_list');
            Route::get('/cities/{id}', 'ProfileDropdownController@city_list');
            Route::get('/languages', 'ProfileDropdownController@language_list');
            Route::get('/religions', 'ProfileDropdownController@religion_list');
            Route::get('/casts/{id}', 'ProfileDropdownController@caste_list');
            Route::get('/sub-casts/{id}', 'ProfileDropdownController@sub_caste_list');
            Route::get('/family-values', 'ProfileDropdownController@family_value_list');
            Route::get('/profile-dropdown', 'ProfileDropdownController@profile_dropdown');
EOD;

$qualityRoute = "            Route::get('/profile/quality-score', 'ProfileCenterController@getQualityScore');";

// Remove them from their original locations
$content = str_replace($dropdownRoutes, '', $content);
$content = str_replace($qualityRoute, '', $content);

// Add them to the auth:sanctum group
$insertionPoint = "        Route::get('/profile/download-biodata', 'ProfileController@download_biodata');";
$newRoutes = <<<'EOD'
        Route::get('/profile/download-biodata', 'ProfileController@download_biodata');

        // Dropdowns and Profile Center (Accessible even if email not verified)
        Route::group(['prefix' => 'member'], function () {
            Route::get('/maritial-status', 'ProfileDropdownController@maritial_status');
            Route::get('/countries', 'ProfileDropdownController@country_list');
            Route::get('/states/{id}', 'ProfileDropdownController@state_list');
            Route::get('/cities/{id}', 'ProfileDropdownController@city_list');
            Route::get('/languages', 'ProfileDropdownController@language_list');
            Route::get('/religions', 'ProfileDropdownController@religion_list');
            Route::get('/casts/{id}', 'ProfileDropdownController@caste_list');
            Route::get('/sub-casts/{id}', 'ProfileDropdownController@sub_caste_list');
            Route::get('/family-values', 'ProfileDropdownController@family_value_list');
            Route::get('/profile-dropdown', 'ProfileDropdownController@profile_dropdown');
            Route::get('/profile/quality-score', 'ProfileCenterController@getQualityScore');
        });
EOD;

$content = str_replace($insertionPoint, $newRoutes, $content);

file_put_contents($filePath, $content);
echo "Routes updated successfully.\n";

<?php

use App\Models\Upload;
use App\Models\Setting;
use App\Models\Addon;
use App\Models\Translation;
use App\Models\Currency;
use App\Models\Member;
use App\Models\ChatThread;
use App\Models\EmailTemplate;
use App\Models\Notification;
use App\Models\User;
use App\Utility\MimoUtility;
use Carbon\Carbon;
use AizPackages\ColorCodeConverter\Services\ColorCodeConverter;
use App\Models\AdditionalMemberInfo;

if (!function_exists('site_url')) {
    function site_url()
    {
        return !empty(env('APP_URL')) ? env('APP_URL') : url('');
    }
}

//highlights the selected navigation on admin panel
if (!function_exists('areActiveRoutes')) {
    function areActiveRoutes(array $routes, $output = "active")
    {
        foreach ($routes as $route) {
            if (Route::currentRouteName() == $route)
                return $output;
        }
    }
}


//return file uploaded via uploader
if (!function_exists('uploaded_asset')) {
    function uploaded_asset($id)
    {
        if ($id === null || $id === '' || $id === 0 || $id === '0') {
            return null;
        }
        if (is_numeric($id)) {
            $asset = Upload::find($id);
            if ($asset && $asset->file_name && $asset->file_name != '0') {
                return static_asset($asset->file_name);
            }
            return null;
        }
        // Non-numeric: treat as direct path
        return static_asset($id);
    }
}

/**
 * Generate an asset path for the application.
 *
 * @param  string  $path
 * @param  bool|null  $secure
 * @return string
 */
if (!function_exists('static_asset')) {
    function static_asset($path, $secure = null)
    {
        if (env('FILESYSTEM_DRIVER') == 's3') {
            return Storage::disk('s3')->url($path);
        } else {
            return app('url')->asset($path, $secure);
        }
    }
}

if (!function_exists('isHttps')) {
    function isHttps()
    {
        return !empty($_SERVER['HTTPS']) && ('on' == $_SERVER['HTTPS']);
    }
}


if (!function_exists('getBaseURL')) {
    function getBaseURL()
    {
        $root = '//' . $_SERVER['HTTP_HOST'];
        $root .= str_replace(basename($_SERVER['SCRIPT_NAME']), '', $_SERVER['SCRIPT_NAME']);

        return $root;
    }
}

if (!function_exists('getFileBaseURL')) {
    function getFileBaseURL()
    {
        if (env('FILESYSTEM_DRIVER') == 's3') {
            return env('AWS_URL') . '/';
        } else {
            return getBaseURL();
        }
    }
}

function translate($key, $lang = null, $replace = [])
{
    // Support translate('key', ['placeholder' => 'value']) short-hand
    if (is_array($lang)) {
        $replace = $lang;
        $lang = null;
    }

    if ($lang == null) {
        $lang = App::getLocale();
    }

    if (!is_string($key)) {
        if (is_scalar($key)) {
            $key = (string) $key;
        } else {
            \Log::warning('translate called with non-string key', ['type' => gettype($key)]);
            $key = json_encode($key, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '';
        }
    }

    $lang_key = preg_replace('/[^A-Za-z0-9\_]/', '', str_replace(' ', '_', strtolower($key)));

    $translations_default = Cache::rememberForever('translations-' . env('DEFAULT_LANGUAGE', 'en'), function () {
        return Translation::where('lang', env('DEFAULT_LANGUAGE', 'en'))->pluck('lang_value', 'lang_key')->toArray();
    });

    if (!isset($translations_default[$lang_key])) {
        $translation_def = new Translation;
        $translation_def->lang = env('DEFAULT_LANGUAGE', 'en');
        $translation_def->lang_key = $lang_key;
        $translation_def->lang_value = $key;
        $translation_def->save();
        Cache::forget('translations-' . env('DEFAULT_LANGUAGE', 'en'));
    }

    $translation_locale = Cache::rememberForever('translations-' . $lang, function () use ($lang) {
        return Translation::where('lang', $lang)->pluck('lang_value', 'lang_key')->toArray();
    });

    //Check for session lang
    if (isset($translation_locale[$lang_key])) {
        $result = $translation_locale[$lang_key];
    } elseif (isset($translations_default[$lang_key])) {
        $result = $translations_default[$lang_key];
    } else {
        $result = $key;
    }

    // Apply placeholder replacements (:key → value)
    if (!empty($replace)) {
        foreach ($replace as $k => $v) {
            $result = str_replace(':' . $k, (string) $v, $result);
        }
    }

    return $result;
}

if (!function_exists('formatBytes')) {
    function formatBytes($bytes, $precision = 2)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        // Uncomment one of the following alternatives
        $bytes /= pow(1024, $pow);
        // $bytes /= (1 << (10 * $pow));

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

// Get settings value
if (!function_exists('get_setting')) {
    function get_setting($key, $default = null)
    {
        $settings = Cache::remember('settings', 86400, function () {
            return Setting::all();
        });

        $setting = $settings->where('type', $key)->first();

        return $setting == null ? $default : $setting->value;
    }
}

// email template data
if (!function_exists('get_email_template')) {
    function get_email_template($identifier, $colmn_name = null)
    {
        $emailTemplate = EmailTemplate::where('identifier', $identifier)->first();
        if ($emailTemplate && $colmn_name) {
            return $emailTemplate->$colmn_name;
        }
        return $emailTemplate;
    }
}




//Shows Bad Results in Seller Hompapage Retruns
if (!function_exists('check_homepage_urls')) {
    function check_homepage_urls($slug)
    {
        if ($slug == "bad" && env('DEMO_MODE') != 'On') {
            return false;
        }
        return true;
    }
}



//Generates Fromatted DateTime
if (!function_exists('TimeDateFormatter')) {
    function TimeDateFormatter()
    {
        date_default_timezone_set('UTC');
        $timestamp = time();
        return pow(substr($timestamp, -10, 9), 2);
    }
}

// Addon Activation Check
if (!function_exists('addon_activation')) {
    // return true;
    function addon_activation($identifier, $default = null)
    {
        $addons = Cache::remember('addons', 86400, function () {
            return Addon::all();
        });

        $activation = $addons->where('unique_identifier', $identifier)->where('activated', 1)->first();
        // return  true; we test it by this 
        return $activation == null ? false : true;
    }
}


// system configurations value
if (!function_exists('get_remaining_package_value')) {
    function get_remaining_package_value($id, $colmn_name)
    {
        $value = Member::where('user_id', $id)->first()->$colmn_name;
        return $value;
    }
}

//
if (!function_exists('package_validity')) {
    function package_validity($id)
    {
        $package_validity = Member::where('user_id', $id)->first()->package_validity;
        if ($package_validity == null || ($package_validity < date('Y-m-d'))) {
            return false;
        } else {
            return true;
        }
    }
}

//formats price to home default price with convertion
if (!function_exists('single_price')) {
    function single_price($price)
    {
        return format_price(convert_price($price));
    }
}

// Log OTP for local testing
if (!function_exists('log_otp_for_testing')) {
    function log_otp_for_testing($type, $code, $destination, $message = null)
    {
        if (app()->environment('production')) {
            return;
        }

        \Log::info('=== ' . strtoupper($type) . ' OTP VERIFICATION ===');
        \Log::info('OTP Code: ' . $code . ' - Destination: ' . $destination);
        \Log::info('Timestamp: ' . now()->format('Y-m-d H:i:s'));
        if ($message) {
            \Log::info('Message: ' . $message);
        }
        \Log::info('=== END ' . strtoupper($type) . ' OTP VERIFICATION ===');
    }
}

//converts currency to home default currency
if (!function_exists('convert_price')) {
    function convert_price($price)
    {
        $business_settings = Setting::where('type', 'system_default_currency')->first();
        if ($business_settings != null) {
            $currency = Currency::find($business_settings->value);
            $price = floatval($price) / floatval($currency->exchange_rate);
        }

        $code = Currency::findOrFail(get_setting('system_default_currency'))->code;
        $currency = Currency::where('code', $code)->first();
        $price = floatval($price) * floatval($currency->exchange_rate);

        return $price;
    }
}

//formats currency
if (!function_exists('format_price')) {
    function format_price($price)
    {
        if (get_setting('decimal_separator') == 1) {
            $fomated_price = number_format($price, get_setting('no_of_decimals'));
        } else {
            $fomated_price = number_format($price, get_setting('no_of_decimals'), ',', ' ');
        }

        if (get_setting('symbol_format') == 1) {
            return currency_symbol() . $fomated_price;
        }
        return $fomated_price . currency_symbol();
    }
}

if (!function_exists('currency_symbol')) {
    function currency_symbol()
    {
        $code = Currency::findOrFail(get_setting('system_default_currency'))->code;
        $currency = Currency::where('code', $code)->first();
        return $currency->symbol;
    }
}


// Unique code create and check
if (!function_exists('unique_code')) {
    function unique_code()
    {
        $latestUser = User::withTrashed()->latest('id')->first();
        $id = $latestUser ? $latestUser->id + 1 : 1;
        $code = get_setting('member_code_prifix') . date('Ym') . $id;
        return $code;
    }
}

// Unique id create and check
if (!function_exists('unique_notify_id')) {
    function unique_notify_id()
    {
        return null;
    }
}


// Filter min value
if (!function_exists('filter_min_value')) {
    function filter_min_value($value)
    {
        return (empty($value) || !is_numeric($value) || $value <= 0.00) ? 0 : $value;
    }
}

if (!function_exists('chat_threads')) {
    function chat_threads()
    {
        $data = array();
        if (Auth::check()) {
            foreach (ChatThread::where('sender_user_id', Auth::user()->id)->orWhere('receiver_user_id', Auth::user()->id)->get() as $key => $chat_thread) {
                if (count($chat_thread->chats()->where('sender_user_id', '!=', Auth::user()->id)->where('seen', 0)->get()) > 0) {
                    $data[] = $chat_thread->id;
                }
            }
        }
        return $data;
    }
}

function timezones()
{
    $timezones = array(
        '(GMT-12:00) International Date Line West' => 'Pacific/Kwajalein',
        '(GMT-11:00) Midway Island' => 'Pacific/Midway',
        '(GMT-11:00) Samoa' => 'Pacific/Apia',
        '(GMT-10:00) Hawaii' => 'Pacific/Honolulu',
        '(GMT-09:00) Alaska' => 'America/Anchorage',
        '(GMT-08:00) Pacific Time (US & Canada)' => 'America/Los_Angeles',
        '(GMT-08:00) Tijuana' => 'America/Tijuana',
        '(GMT-07:00) Arizona' => 'America/Phoenix',
        '(GMT-07:00) Mountain Time (US & Canada)' => 'America/Denver',
        '(GMT-07:00) Chihuahua' => 'America/Chihuahua',
        '(GMT-07:00) La Paz' => 'America/Chihuahua',
        '(GMT-07:00) Mazatlan' => 'America/Mazatlan',
        '(GMT-06:00) Central Time (US & Canada)' => 'America/Chicago',
        '(GMT-06:00) Central America' => 'America/Managua',
        '(GMT-06:00) Guadalajara' => 'America/Mexico_City',
        '(GMT-06:00) Mexico City' => 'America/Mexico_City',
        '(GMT-06:00) Monterrey' => 'America/Monterrey',
        '(GMT-06:00) Saskatchewan' => 'America/Regina',
        '(GMT-05:00) Eastern Time (US & Canada)' => 'America/New_York',
        '(GMT-05:00) Indiana (East)' => 'America/Indiana/Indianapolis',
        '(GMT-05:00) Bogota' => 'America/Bogota',
        '(GMT-05:00) Lima' => 'America/Lima',
        '(GMT-05:00) Quito' => 'America/Bogota',
        '(GMT-04:00) Atlantic Time (Canada)' => 'America/Halifax',
        '(GMT-04:00) Caracas' => 'America/Caracas',
        '(GMT-04:00) La Paz' => 'America/La_Paz',
        '(GMT-04:00) Santiago' => 'America/Santiago',
        '(GMT-03:30) Newfoundland' => 'America/St_Johns',
        '(GMT-03:00) Brasilia' => 'America/Sao_Paulo',
        '(GMT-03:00) Buenos Aires' => 'America/Argentina/Buenos_Aires',
        '(GMT-03:00) Georgetown' => 'America/Argentina/Buenos_Aires',
        '(GMT-03:00) Greenland' => 'America/Godthab',
        '(GMT-02:00) Mid-Atlantic' => 'America/Noronha',
        '(GMT-01:00) Azores' => 'Atlantic/Azores',
        '(GMT-01:00) Cape Verde Is.' => 'Atlantic/Cape_Verde',
        '(GMT) Casablanca' => 'Africa/Casablanca',
        '(GMT) Dublin' => 'Europe/London',
        '(GMT) Edinburgh' => 'Europe/London',
        '(GMT) Lisbon' => 'Europe/Lisbon',
        '(GMT) London' => 'Europe/London',
        '(GMT) UTC' => 'UTC',
        '(GMT) Monrovia' => 'Africa/Monrovia',
        '(GMT+01:00) Amsterdam' => 'Europe/Amsterdam',
        '(GMT+01:00) Belgrade' => 'Europe/Belgrade',
        '(GMT+01:00) Berlin' => 'Europe/Berlin',
        '(GMT+01:00) Bern' => 'Europe/Berlin',
        '(GMT+01:00) Bratislava' => 'Europe/Bratislava',
        '(GMT+01:00) Brussels' => 'Europe/Brussels',
        '(GMT+01:00) Budapest' => 'Europe/Budapest',
        '(GMT+01:00) Copenhagen' => 'Europe/Copenhagen',
        '(GMT+01:00) Ljubljana' => 'Europe/Ljubljana',
        '(GMT+01:00) Madrid' => 'Europe/Madrid',
        '(GMT+01:00) Paris' => 'Europe/Paris',
        '(GMT+01:00) Prague' => 'Europe/Prague',
        '(GMT+01:00) Rome' => 'Europe/Rome',
        '(GMT+01:00) Sarajevo' => 'Europe/Sarajevo',
        '(GMT+01:00) Skopje' => 'Europe/Skopje',
        '(GMT+01:00) Stockholm' => 'Europe/Stockholm',
        '(GMT+01:00) Vienna' => 'Europe/Vienna',
        '(GMT+01:00) Warsaw' => 'Europe/Warsaw',
        '(GMT+01:00) West Central Africa' => 'Africa/Lagos',
        '(GMT+01:00) Zagreb' => 'Europe/Zagreb',
        '(GMT+02:00) Athens' => 'Europe/Athens',
        '(GMT+02:00) Bucharest' => 'Europe/Bucharest',
        '(GMT+02:00) Cairo' => 'Africa/Cairo',
        '(GMT+02:00) Harare' => 'Africa/Harare',
        '(GMT+02:00) Helsinki' => 'Europe/Helsinki',
        '(GMT+02:00) Istanbul' => 'Europe/Istanbul',
        '(GMT+02:00) Jerusalem' => 'Asia/Jerusalem',
        '(GMT+02:00) Kyev' => 'Europe/Kiev',
        '(GMT+02:00) Minsk' => 'Europe/Minsk',
        '(GMT+02:00) Pretoria' => 'Africa/Johannesburg',
        '(GMT+02:00) Riga' => 'Europe/Riga',
        '(GMT+02:00) Sofia' => 'Europe/Sofia',
        '(GMT+02:00) Tallinn' => 'Europe/Tallinn',
        '(GMT+02:00) Vilnius' => 'Europe/Vilnius',
        '(GMT+03:00) Baghdad' => 'Asia/Baghdad',
        '(GMT+03:00) Kuwait' => 'Asia/Kuwait',
        '(GMT+03:00) Moscow' => 'Europe/Moscow',
        '(GMT+03:00) Nairobi' => 'Africa/Nairobi',
        '(GMT+03:00) Riyadh' => 'Asia/Riyadh',
        '(GMT+03:00) St. Petersburg' => 'Europe/Moscow',
        '(GMT+03:00) Volgograd' => 'Europe/Volgograd',
        '(GMT+03:30) Tehran' => 'Asia/Tehran',
        '(GMT+04:00) Abu Dhabi' => 'Asia/Muscat',
        '(GMT+04:00) Baku' => 'Asia/Baku',
        '(GMT+04:00) Muscat' => 'Asia/Muscat',
        '(GMT+04:00) Tbilisi' => 'Asia/Tbilisi',
        '(GMT+04:00) Yerevan' => 'Asia/Yerevan',
        '(GMT+04:30) Kabul' => 'Asia/Kabul',
        '(GMT+05:00) Ekaterinburg' => 'Asia/Yekaterinburg',
        '(GMT+05:00) Islamabad' => 'Asia/Karachi',
        '(GMT+05:00) Karachi' => 'Asia/Karachi',
        '(GMT+05:00) Tashkent' => 'Asia/Tashkent',
        '(GMT+05:30) Chennai' => 'Asia/Kolkata',
        '(GMT+05:30) Kolkata' => 'Asia/Kolkata',
        '(GMT+05:30) Mumbai' => 'Asia/Kolkata',
        '(GMT+05:30) New Delhi' => 'Asia/Kolkata',
        '(GMT+05:45) Kathmandu' => 'Asia/Kathmandu',
        '(GMT+06:00) Almaty' => 'Asia/Almaty',
        '(GMT+06:00) Astana' => 'Asia/Dhaka',
        '(GMT+06:00) Dhaka' => 'Asia/Dhaka',
        '(GMT+06:00) Novosibirsk' => 'Asia/Novosibirsk',
        '(GMT+06:00) Sri Jayawardenepura' => 'Asia/Colombo',
        '(GMT+06:30) Rangoon' => 'Asia/Rangoon',
        '(GMT+07:00) Bangkok' => 'Asia/Bangkok',
        '(GMT+07:00) Hanoi' => 'Asia/Bangkok',
        '(GMT+07:00) Jakarta' => 'Asia/Jakarta',
        '(GMT+07:00) Krasnoyarsk' => 'Asia/Krasnoyarsk',
        '(GMT+08:00) Beijing' => 'Asia/Hong_Kong',
        '(GMT+08:00) Chongqing' => 'Asia/Chongqing',
        '(GMT+08:00) Hong Kong' => 'Asia/Hong_Kong',
        '(GMT+08:00) Irkutsk' => 'Asia/Irkutsk',
        '(GMT+08:00) Kuala Lumpur' => 'Asia/Kuala_Lumpur',
        '(GMT+08:00) Perth' => 'Australia/Perth',
        '(GMT+08:00) Singapore' => 'Asia/Singapore',
        '(GMT+08:00) Taipei' => 'Asia/Taipei',
        '(GMT+08:00) Ulaan Bataar' => 'Asia/Irkutsk',
        '(GMT+08:00) Urumqi' => 'Asia/Urumqi',
        '(GMT+09:00) Osaka' => 'Asia/Tokyo',
        '(GMT+09:00) Sapporo' => 'Asia/Tokyo',
        '(GMT+09:00) Seoul' => 'Asia/Seoul',
        '(GMT+09:00) Tokyo' => 'Asia/Tokyo',
        '(GMT+09:00) Yakutsk' => 'Asia/Yakutsk',
        '(GMT+09:30) Adelaide' => 'Australia/Adelaide',
        '(GMT+09:30) Darwin' => 'Australia/Darwin',
        '(GMT+10:00) Brisbane' => 'Australia/Brisbane',
        '(GMT+10:00) Canberra' => 'Australia/Sydney',
        '(GMT+10:00) Guam' => 'Pacific/Guam',
        '(GMT+10:00) Hobart' => 'Australia/Hobart',
        '(GMT+10:00) Melbourne' => 'Australia/Melbourne',
        '(GMT+10:00) Port Moresby' => 'Pacific/Port_Moresby',
        '(GMT+10:00) Sydney' => 'Australia/Sydney',
        '(GMT+10:00) Vladivostok' => 'Asia/Vladivostok',
        '(GMT+11:00) Magadan' => 'Asia/Magadan',
        '(GMT+11:00) New Caledonia' => 'Asia/Magadan',
        '(GMT+11:00) Solomon Is.' => 'Asia/Magadan',
        '(GMT+12:00) Auckland' => 'Pacific/Auckland',
        '(GMT+12:00) Fiji' => 'Pacific/Fiji',
        '(GMT+12:00) Kamchatka' => 'Asia/Kamchatka',
        '(GMT+12:00) Marshall Is.' => 'Pacific/Fiji',
        '(GMT+12:00) Wellington' => 'Pacific/Auckland',
        '(GMT+13:00) Nuku\'alofa' => 'Pacific/Tongatapu'
    );

    return $timezones;
}

if (!function_exists('app_timezone')) {
    function app_timezone()
    {
        return config('app.timezone');
    }
}

function hex2rgba($color, $opacity = false)
{
    return (new ColorCodeConverter())->convertHexToRgba($color, $opacity);
}

if (!function_exists('get_max_date')) {
    function get_max_date()
    {
        $member_min_age = get_setting('member_min_age') != null ? get_setting('member_min_age') : 0;
        $current_date = Carbon::now();
        $max_date = $current_date->subYears($member_min_age);
        return date("Y-m-d", strtotime($max_date));
    }
}

if (!function_exists('show_profile_picture')) {
    function show_profile_picture($user)
    {
        if (!$user || $user->photo == null || (int) $user->photo_approved !== 1) {
            return false;
        }

        if (Auth::check() && Auth::user()->id === $user->id) {
            return true;
        }

        $visibility = \App\Utility\MemberUtility::resolve_media_visibility($user->id, 'profile');
        $effectiveLevel = (int) ($visibility['effective_level'] ?? 0);

        if ($effectiveLevel === 0) {
            return true;
        }

        if (!Auth::check()) {
            return false;
        }

        if ($effectiveLevel === 1) {
            return (int) (Auth::user()->membership ?? 0) === 2;
        }

        if ($effectiveLevel === 2) {
            return true;
        }

        $photo_request = \App\Utility\MemberUtility::member_profile_photo_request_info($user->id);
        return ($photo_request['profile_photo_request_state'] ?? 'none') === 'approved';
    }
}

// file upload for api
if (!function_exists('upload_api_file')) {
    function upload_api_file($image)
    {
        $extension = strtolower((string) $image->getClientOriginalExtension());
        $convertible_extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];

        $filename = time() . '_' . uniqid();
        $destinationPath = public_path('uploads/all');

        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0777, true);
        }

        if (in_array($extension, $convertible_extensions, true)) {
            try {
                // Optimize image
                $img = Image::make($image->path());

                // Resize if too large
                if ($img->width() > 1200 || $img->height() > 1200) {
                    $img->resize(1200, 1200, function ($constraint) {
                        $constraint->aspectRatio();
                        $constraint->upsize();
                    });
                }

                // Convert to webp for better compression
                $filename .= '.webp';
                $path = 'uploads/all/' . $filename;
                $fullPath = $destinationPath . '/' . $filename;

                $img->encode('webp', 80)->save($fullPath);
                $extension = 'webp';
            } catch (\Throwable $e) {
                // Fallback to original file when optimization/conversion fails.
                \Log::warning('Image optimization failed; storing original file', [
                    'user_id' => auth()->id(),
                    'original_name' => $image->getClientOriginalName(),
                    'extension' => $extension,
                    'error' => $e->getMessage(),
                ]);

                $safeExtension = $extension !== '' ? $extension : 'bin';
                $filename .= '.' . $safeExtension;
                $path = 'uploads/all/' . $filename;
                $image->move($destinationPath, $filename);
                $extension = $safeExtension;
            }
        } else {
            // Non-image or non-optimizable file
            $safeExtension = $extension !== '' ? $extension : 'bin';
            $filename .= '.' . $safeExtension;
            $path = 'uploads/all/' . $filename;
            $image->move($destinationPath, $filename);
            $extension = $safeExtension;
        }

        $upload = new App\Models\Upload();
        $upload->file_original_name = pathinfo($image->getClientOriginalName(), PATHINFO_FILENAME);
        $upload->file_name = $path;
        $upload->user_id = auth()->id();
        $upload->extension = $extension;
        $upload->type = 'image';
        $upload->file_size = filesize($destinationPath . '/' . $filename);
        $upload->save();

        return $upload->id;
    }
}
// text format for dose_not_matter
if (!function_exists('attribute_text_format')) {
    function attribute_text_format($text = null)
    {
        $formatted_text = $text;
        if ($text == 'yes') {
            $formatted_text = 'Yes';
        } elseif ($text == 'no') {
            $formatted_text = 'No';
        } elseif ($text == 'dose_not_matter') {
            $formatted_text = 'Does Not Matter';
        }
        return $formatted_text;
    }
}

/**
 * Return gender-aware default avatar URL.
 * gender: 1=male, 2=female (matches members.gender column)
 */
if (!function_exists("gender_avatar")) {
    function gender_avatar($gender = null) {
        $g = is_object($gender) ? ($gender->gender ?? null) : $gender;
        $isFemale = ($g == 2 || $g === "2" || strtolower((string)$g) === "female" || strtolower((string)$g) === "f");
        return static_asset($isFemale ? "assets/img/female-avatar-place.png" : "assets/img/avatar-place.png");
    }
}

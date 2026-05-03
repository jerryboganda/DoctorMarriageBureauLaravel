<?php

namespace App\Http\Controllers\Auth;

use Notification;
use App\Models\User;
use App\Models\Member;
use App\Models\Package;
use App\Rules\RecaptchaRule;
use Illuminate\Http\Request;
use App\Models\EmailTemplate;
use App\Utility\EmailUtility;
use App\Models\ReferralCode;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;
use App\Providers\RouteServiceProvider;
use Illuminate\Support\Facades\Validator;
use App\Notifications\DbStoreNotification;
use App\Services\ReferralService;
use Kutia\Larafirebase\Facades\Larafirebase;
use Illuminate\Foundation\Auth\RegistersUsers;

class RegisterController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Register Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles the registration of new users as well as their
    | validation and creation. By default this controller uses a trait to
    | provide this functionality without requiring any additional code.
    |
    */

    use RegistersUsers;

    /**
     * Where to redirect users after registration.
     *
     * @var string
     */
    protected $redirectTo = RouteServiceProvider::HOME;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Get a validator for an incoming registration request.
     *
     * @param  array  $data
     * @return \Illuminate\Contracts\Validation\Validator
     */

    public function showRegistrationForm()
    {
        return view('frontend.user_registration');
    }

    protected function validator(array $data)
    {
        if (isset($data['phone'])) {
            $data['phone'] = preg_replace('/[^\d+]/', '', $data['phone']);
            if (str_starts_with($data['phone'], '03') && \Illuminate\Support\Str::length($data['phone']) === 11) {
                $data['phone'] = '+92' . \Illuminate\Support\Str::substr($data['phone'], 1);
            } elseif (str_starts_with($data['phone'], '3') && \Illuminate\Support\Str::length($data['phone']) === 10) {
                $data['phone'] = '+92' . $data['phone'];
            }
        }

        return Validator::make($data, [
            'on_behalf'            => 'nullable|integer',
            'first_name'           => ['required', 'string', 'max:255'],
            'last_name'            => ['required', 'string', 'max:255'],
            'gender'               => 'required',
            'date_of_birth'        => 'required|date',
            'phone'                 => [
                'required', 
                'string', 
                Rule::unique('users')->whereNull('deleted_at')
            ],
            'email'                 => [
                'required', 
                'email', 
                Rule::unique('users')->whereNull('deleted_at')
            ],
            'password'             => ['required', 'string', 'min:8', 'confirmed'],
            'referral_code'        => 'nullable|string|max:50',
            'medical_license_number' => ['required', 'string', 'max:255'],
            'specialization'       => ['required', 'string', 'max:255'],
            'verification_document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'], // 10MB max
            'g-recaptcha-response' => [
                Rule::when(get_setting('google_recaptcha_activation') == 1, ['required', new RecaptchaRule()], ['sometimes'])
            ],
            'checkbox_example_1'   => ['required', 'string'],
        ],
        [
            //'on_behalf.required' => translate('on_behalf is required'),
            'on_behalf.integer' => translate('on_behalf should be integer value'),
            'first_name.required' => translate('first_name is required'),
            'last_name.required' => translate('last_name is required'),
            'gender.required' => translate('gender is required'),
            'date_of_birth.required' => translate('date_of_birth is required'),
            'date_of_birth.date' => translate('date_of_birth should be in date format'),
            'email.required' => translate('Email is required'),
            'email.email' => translate('Email must be a valid email address'),
            'email.unique' => translate('This email address is already registered'),
            'phone.required' => translate('Phone is required'),
            'phone.unique' => translate('This phone number is already registered'),
            'password.required' => translate('Password is required'),
            'password.confirmed' => translate('Password confirmation does not match'),
            'password.min' => translate('Minimum 8 digits required for password'),
            'medical_license_number.required' => translate('Medical License Number is required'),
            'specialization.required' => translate('Specialization is required'),
            'verification_document.required' => translate('Verification Document is required'),
            'verification_document.max' => translate('Document size must not exceed 10MB'),
            'checkbox_example_1.required'    => translate('You must agree to our terms and conditions.'),
        ]);
    }

    /**
     * Create a new user instance after a valid registration.
     *
     * @param  array  $data
     * @return \App\Models\User
     */
    protected function create(array $data)
    {
        // Auto-approve all users since email and phone verification is completed
        $approval = 1;
        
        // Create user with both email and phone (both are now mandatory)
        $userData = [
            'first_name'  => $data['first_name'],
            'last_name'   => $data['last_name'],
            'membership'  => 1,
            'user_type'   => 'member',
            'email'       => $data['email'],
            'phone'       => '+' . ($data['country_code'] ?? '') . $data['phone'],
            'password'    => Hash::make($data['password']),
            'code'        => unique_code(),
            'approved'    => $approval,
            'verification_code' => rand(100000, 999999)
        ];
                
        // Set email_verified_at to null to require manual OTP verification
        $userData['email_verified_at'] = null;
                
        \Log::info('Creating user with data: ' . json_encode($userData));
        $user = User::create($userData);
        \Log::info('User created with ID: ' . $user->id . ' - Approved: ' . $user->approved);

        if (addon_activation('referral_system')) {
            ReferralCode::getOrCreateForUser($user->id);

            $referralCode = $data['referral_code'] ?? null;
            if (!empty($referralCode)) {
                try {
                    $referralResult = (new ReferralService())->createReferral($user->id, $referralCode, 'link', [
                        'ip' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                        'source' => 'web_registration',
                    ]);

                    if (empty($referralResult['success'])) {
                        \Log::warning('Referral code could not be applied during web registration: ' . ($referralResult['message'] ?? 'Unknown error'));
                    }
                } catch (\Exception $e) {
                    \Log::error('Referral processing error during web registration: ' . $e->getMessage());
                }
            }
        }

        \Log::info('Creating member for user ID: ' . $user->id);
        $member                             = new Member;
        $member->user_id                    = $user->id;
        
        // Handle Validation Document Upload
        if (request()->hasFile('verification_document')) {
            $file = request()->file('verification_document');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->storeAs('uploads/verification_docs', $filename, 'public');
            $member->verification_document = 'uploads/verification_docs/' . $filename;
        }

        // Save Medical Details
        $member->medical_license_number     = $data['medical_license_number'];
        $member->specialization             = $data['specialization'];
        $member->save();
        
        \Log::info('Member created with ID: ' . $member->id);

        $member->gender                     = $data['gender'];
        $member->on_behalves_id             = $data['on_behalf'] ?? null;
        $member->birthday                   = date('Y-m-d', strtotime($data['date_of_birth']));

        $package = Package::where('id', 1)->first() ?? Package::first();
        if ($package) {
            $member->current_package_id             = $package->id;
            $member->remaining_interest             = $package->express_interest;
            $member->remaining_photo_gallery        = $package->photo_gallery;
            $member->remaining_contact_view         = $package->contact;
            $member->remaining_profile_viewer_view  = $package->profile_viewers_view;
            $member->remaining_profile_image_view   = $package->profile_image_view;
            $member->remaining_gallery_image_view   = $package->gallery_image_view;
            $member->auto_profile_match             = $package->auto_profile_match;
            $member->package_validity               = Date('Y-m-d', strtotime($package->validity . " days"));
        }
        $member->save();


        // Account opening Email to member
        if ($data['email'] != null  && env('MAIL_USERNAME') != null) {
            $account_oppening_email = EmailTemplate::where('identifier', 'account_oppening_email')->first();
            if ($account_oppening_email && $account_oppening_email->status == 1) {
                EmailUtility::account_oppening_email($user->id, $data['password']);
            }
        }

        // Clear verification sessions after successful registration
        if (isset($data['email'])) {
            session()->forget('email_verified_' . $data['email']);
        }
        if (isset($data['phone'])) {
            session()->forget('phone_verified_' . $data['phone']);
        }

        return $user;
    }

    public function register(Request $request)
    {
        \Log::info('=== REGISTRATION ATTEMPT ===');
        \Log::info('All Request Data: ' . json_encode($request->all()));
        \Log::info('Email: ' . $request->email);
        \Log::info('Phone: ' . $request->phone);
        \Log::info('Country Code: ' . $request->country_code);
        \Log::info('First Name: ' . $request->first_name);
        \Log::info('Last Name: ' . $request->last_name);
        
        // Check if email already exists
            if (User::where('email', $request->email)->whereNull('deleted_at')->first() != null) {
            \Log::info('Registration failed: Email already exists');
            flash(translate('Email already registered'), 'error');
            return back()->withInput();
        }
        
        // Check if phone already exists
        if (User::where('phone', '+' . $request->country_code . $request->phone)->whereNull('deleted_at')->first() != null) {
            \Log::info('Registration failed: Phone already exists');
            flash(translate('Phone already registered'), 'error');
            return back()->withInput();
        }

        // Validate the request data
        $validator = $this->validator($request->all());
        if ($validator->fails()) {
            \Log::info('Validation failed: ' . json_encode($validator->errors()));
            flash(translate('Please check the form and try again'), 'error');
            return back()->withErrors($validator)->withInput();
        }

        $user = $this->create($request->all());
        \Log::info('User created successfully with ID: ' . $user->id);

        // Always login the user after registration to proceed to OTP verification
        $this->guard()->login($user);

        try {
            $notify_type = 'member_registration';
            $id = null;
            $notify_by = $user->id;
            $info_id = $user->id;
            $message = translate('A new member has been registered to your system. Name: ') . $user->first_name . ' ' . $user->last_name;
            $route = route('members.index', $user->membership);

            // fcm 
            if (get_setting('firebase_push_notification') == 1) {
                $fcmTokens = User::where('user_type', 'admin')->whereNotNull('fcm_token')->pluck('fcm_token')->toArray();
                Larafirebase::withTitle($notify_type)
                    ->withBody($message)
                    ->sendMessage($fcmTokens);
            }
            // end of fcm
            
            // Check if admin user exists before sending notification
            $adminUser = User::where('user_type', 'admin')->first();
            if ($adminUser) {
                Notification::send($adminUser, new DbStoreNotification($notify_type, $id, $notify_by, $info_id, $message, $route));
            }
        } catch (\Throwable $e) {
            \Log::error('Registration notification error: ' . $e->getMessage());
        }
        if (env('MAIL_USERNAME') != null && (get_email_template('account_opening_email_to_admin', 'status') == 1)) {
            $admin = User::where('user_type', 'admin')->first();
            EmailUtility::account_opening_email_to_admin($user, $admin);
        }

        if (get_setting('email_verification') == 1) {
            if ($user->email != null) {
                event(new Registered($user));
                flash(translate('Registration successfull. Please verify your email.'))->success();
            } else {
                flash(translate('Registration successfull. Please verify your phone number.'))->success();
            }
        } else {
            flash(translate('Registration successfull.'))->success();
        }

        return $this->registered($request, $user)
            ?: redirect($this->redirectPath());
    }

    protected function registered(Request $request, $user)
    {
        return redirect()->route('otp.initiation');
    }
}

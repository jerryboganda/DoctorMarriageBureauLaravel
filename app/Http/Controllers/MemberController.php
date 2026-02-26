<?php

namespace App\Http\Controllers;

use App\Models\AdditionalAttribute;
use App\Models\Address;
use App\Models\AnnualSalaryRange;
use App\Models\Astrology;
use App\Models\Attitude;
use App\Models\Career;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use App\Models\Member;
use App\Models\Package;
use App\Models\Country;
use App\Models\State;
use App\Models\City;
use App\Models\Religion;
use App\Models\Caste;
use App\Models\ChatThread;
use App\Models\Education;
use App\Models\ExpressInterest;
use App\Models\Family;
use App\Models\SubCaste;
use App\Models\MemberLanguage;
use App\Models\FamilyValue;
use App\Models\GalleryImage;
use App\Models\HappyStory;
use App\Models\Hobby;
use App\Models\IgnoredUser;
use App\Models\Lifestyle;
use App\Models\MaritalStatus;
use App\Models\OnBehalf;
use App\Models\PackagePayment;
use App\Models\PartnerExpectation;
use App\Models\PhysicalAttribute;
use App\Models\ProfileMatch;
use App\Models\Recidency;
use App\Models\ReportedUser;
use App\Models\Setting;
use App\Models\Shortlist;
use App\Models\SpiritualBackground;
use App\Models\Staff;
use App\Models\Upload;
use App\Models\Wallet;
use App\Models\User;
use Hash;
use Validator;
use Redirect;
use Auth;
use Illuminate\Support\Facades\Log;
use App\Utility\EmailUtility;
use App\Utility\SmsUtility;
use MehediIitdu\CoreComponentRepository\CoreComponentRepository;

class MemberController extends Controller
{
    public function __construct()
    {
        $this->middleware(['permission:show_members'])->only('index');
        $this->middleware(['permission:create_member'])->only('create');
        $this->middleware(['permission:edit_member'])->only('edit');
        $this->middleware(['permission:delete_member'])->only('destroy');
        $this->middleware(['permission:view_member_profile'])->only('show');
        $this->middleware(['permission:block_member'])->only('block');
        $this->middleware(['permission:update_member_package'])->only('package_info');
        $this->middleware(['permission:login_as_member'])->only('login');
        $this->middleware(['permission:deleted_member_show'])->only('deleted_members');
        $this->middleware(['permission:show_unapproved_profile_picrures'])->only('unapproved_profile_pictures');
        $this->middleware(['permission:approve_profile_picrures'])->only('approve_profile_image');
        $this->middleware(['permission:approve_member'])->only('show_verification_info');
        $this->middleware(['permission:edit_member'])->only([
            'basic_info_update',
            'introduction_update',
            'language_info_update',
            'setMemberPassword',
        ]);
        

        $this->rules = [
            'first_name'        => ['required', 'max:255'],
            'last_name'         => ['required', 'max:255'],
            'email'             => ['max:255', Rule::unique('users', 'email')->whereNull('deleted_at')],
            'gender'            => ['required'],
            'date_of_birth'     => ['required'],
            'on_behalf'         => ['nullable'],
            'package'           => ['required'],
            'password'          => ['min:8', 'required_with:confirm_password', 'same:confirm_password'],
            'confirm_password'  => ['min:8'],
        ];

        $this->messages = [
            'first_name.required'       => translate('First name is required'),
            'first_name.max'            => translate('Max 255 characters'),
            'last_name.required'        => translate('First name is required'),
            'last_name.max'             => translate('Max 255 characters'),
            'email.max'                 => translate('Max 255 characters'),
            'email.unique'              => translate('Email Should be unique'),
            'gender.required'           => translate('Gender is required'),
            'date_of_birth.required'    => translate('Gender is required'),
            // 'on_behalf.required'        => translate('On behalf is required'),
            'package.required'          => translate('Package is required'),
            'password.min'              => translate('Minimum 8 characters'),
            'password.required_with'    => translate('Password and Confirm password are required'),
            'password.same'             => translate('Password and Confirmed password did not matched'),
            'confirm_password.min'      => translate('Minimum 8 characters'),
        ];
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $id)
    {
        CoreComponentRepository::instantiateShopRepository();
        CoreComponentRepository::initializeCache();

       $sort_search = null;
        $members = User::latest()->where('user_type', 'member')->where('membership', $id);

        if ($request->has('search')) {
            $sort_search = trim((string) $request->search);
            $this->applyMemberSearch($members, $sort_search);
        }


        $members = $members->paginate(10);
        $this->appendWhatsappMetadataToMembers($members, 'general');
        return view('admin.members.index', compact('members', 'sort_search'));
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        return view('admin.members.create');
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $rules = $this->rules;
        $messages = $this->messages;
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            flash(translate('Something went wrong'))->error();
            return Redirect::back()->withErrors($validator);
        }

        if ($request->email == null && $request->phone == null) {
            flash(translate('Email and Phone both can not be null.'))->error();
            return back();
        }

        if (filter_var($request->email, FILTER_VALIDATE_EMAIL)) {
            if (User::where('email', $request->email)->first() != null) {
                flash(translate('Email or Phone already exists.'))->error();
                return back();
            }
        } elseif (User::where('phone', '+' . $request->country_code . $request->phone)->first() != null) {
            flash(translate('Phone already exists.'))->error();
            return back();
        }

        $user               = new user;
        $user->user_type    = 'member';
        $user->code         = unique_code();
        $user->first_name   = $request->first_name;
        $user->last_name    = $request->last_name;
        $user->password     = Hash::make($request->password);
        $user->photo        = $request->photo;
        $user->email        = $request->email;
        if ($request->phone != null) {
            $user->phone        = '+' . $request->country_code . $request->phone;
        }
        if ($request->member_verification == 1) {
            $user->email_verified_at     = date('Y-m-d h:m:s');
        }
        if ($user->save()) {
            $member                             = new Member;
            $member->user_id                    = $user->id;
            $member->gender                     = $request->gender;
            $member->on_behalves_id             = $request->on_behalf ?? null;
            $member->birthday                   = date('Y-m-d', strtotime($request->date_of_birth));

            $package                                = Package::where('id', $request->package)->first();
            $member->current_package_id             = $package->id;
            $member->remaining_interest             = $package->express_interest;
            $member->remaining_photo_gallery        = $package->photo_gallery;
            $member->remaining_contact_view         = $package->contact;
            $member->remaining_profile_viewer_view  = $package->profile_viewers_view;
            $member->remaining_profile_image_view   = $package->profile_image_view;
            $member->remaining_gallery_image_view   = $package->gallery_image_view;
            $member->auto_profile_match             = $package->auto_profile_match;
            $member->package_validity               = Date('Y-m-d', strtotime($package->validity . " days"));
            $membership                             = $package->id == 1 ? 1 : 2;
            $member->save();

            $user_update                = User::findOrFail($user->id);
            $user_update->membership    = $membership;
            $user_update->save();

            // Account opening email to member
            if ($user->email != null  && env('MAIL_USERNAME') != null && (get_email_template('account_oppening_email', 'status') == 1)) {
                EmailUtility::account_oppening_email($user->id, $request->password);
            }

            // Account Opening SMS to member
            if ($user->phone != null && addon_activation('otp_system') && (get_sms_template('account_opening_by_admin', 'status') == 1)) {
                SmsUtility::account_opening_by_admin($user, $request->password);
            }

            flash('New member has been added successfully')->success();
            return redirect()->route('members.index', $membership);
        }

        flash('Sorry! Something went wrong.')->error();
        return back();
    }

    public function verification_form ()
    {   
        $user = auth()->user();
        if ($user->verification_info == null) {
            return view('frontend.member.member_verifiction_form', compact('user'));
        } else {
            flash(translate('Sorry! You have sent verification request already.'))->error();
            return back();
        }
    }

    public function verification_info_store(Request $request) {
        $data = array();
        $i = 0;
        foreach (json_decode(Setting::where('type', 'verification_form')->first()->value) as $key => $element) {
            $item = array();
            if ($element->type == 'text') {
                $item['type'] = 'text';
                $item['label'] = $element->label;
                $item['value'] = $request['element_' . $i];
            } elseif ($element->type == 'select' || $element->type == 'radio') {
                $item['type'] = 'select';
                $item['label'] = $element->label;
                $item['value'] = $request['element_' . $i];
            } elseif ($element->type == 'multi_select') {
                $item['type'] = 'multi_select';
                $item['label'] = $element->label;
                $item['value'] = json_encode($request['element_' . $i]);
            } elseif ($element->type == 'file') {
                $item['type'] = 'file';
                $item['label'] = $element->label;
                $item['value'] = $request['element_' . $i]->store('uploads/verification_form');
            }
            array_push($data, $item);
            $i++;
        }
        $user = auth()->user();
        $user->verification_info = json_encode($data);
        $user->approved = 0;
        if ($user->save()) {
            flash(translate('Your verification request has been submitted successfully!'))->success();
            return redirect()->route('dashboard');
        }

        flash(translate('Sorry! Something went wrong.'))->error();
        return back();
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $member = User::findOrFail(decrypt($id));
        $present_address = Address::where('user_id',$member->id)->where('type','present')->first();
        $educations = Education::where('user_id',$member->id)->orderBy('is_highest_degree', 'desc')->get();
        $careers = Career::where('user_id',$member->id)->orderBy('present', 'desc')->get();
        $permanent_address = Address::where('user_id', $member->id)->where('type', 'permanent')->first();
        $additional_attributes  = AdditionalAttribute::where('status', 1)->get();

        return view('admin.members.view', compact('member', 'present_address', 'educations', 'careers', 'permanent_address', 'additional_attributes'));
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        $data['member']             = User::findOrFail(decrypt($id));
        $data['countries']          = Country::where('status', 1)->get();
        $data['states']             = State::all();
        $data['cities']             = City::all();
        $data['religions']          = Religion::all();
        $data['castes']             = Caste::all();
        $data['sub_castes']         = SubCaste::all();
        $data['family_values']      = FamilyValue::all();
        $data['marital_statuses']   = MaritalStatus::all();
        $data['on_behalves']        = OnBehalf::all();
        $data['languages']          = MemberLanguage::all();
        $data['additional_attributes']  = AdditionalAttribute::where('status', 1)->get();
        $data['annual_salary_ranges'] = AnnualSalaryRange::orderBy('min_salary','asc')->get();

        return view('admin.members.edit.index', $data);
    }


    public function introduction_edit(Request $request)
    {
        $member = User::findOrFail($request->id);
        return view('admin.members.edit_profile_attributes.introduction', compact('member'));
    }

    public function introduction_update(Request $request, $id)
    {
        $member = Member::findOrFail($id);
        $member->introduction = $request->introduction;
        if ($member->save()) {
            flash('Member introduction info has been updated successfully')->success();
            return back();
        }
        flash('Sorry! Something went wrong.')->error();
        return back();
    }

    public function basic_info_update(Request $request, $id)
    {
        $this->rules = [
            'first_name'    => ['required', 'max:255'],
            'last_name'     => ['required', 'max:255'],
            'gender'        => ['required'],
            'date_of_birth' => ['required'],
            'on_behalf'     => ['nullable'],
            'marital_status' => ['required'],
            'annual_salary_range' => ['required'],
        ];
        $this->messages = [
            'first_name.required'             => translate('First Name is required'),
            'first_name.max'                  => translate('Max 255 characters'),
            'last_name.required'              => translate('First Name is required'),
            'last_name.max'                   => translate('Max 255 characters'),
            'gender.required'                 => translate('Gender is required'),
            'date_of_birth.required'          => translate('Date Of Birth is required'),
            // 'on_behalf.required'              => translate('On Behalf is required'),
            'marital_status.required'         => translate('Marital Status is required'),
            'annual_salary_range.required'         => translate('Marital Status is required'),
        ];

        $rules = $this->rules;
        $messages = $this->messages;
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            flash(translate('Something went wrong'))->error();
            return Redirect::back()->withErrors($validator);
        }
        if ($request->email == null && $request->phone == null) {
            flash(translate('Email and Phone number both can not be null. '))->error();
            return back();
        }

        $user               = User::findOrFail($request->id);
        $user->first_name   = $request->first_name;
        $user->last_name    = $request->last_name;

        if (get_setting('profile_picture_approval_by_admin') && $request->photo != $user->photo && auth()->user()->user_type == 'member') {
            $user->photo_approved = 0;
        }
        $user->photo        = $request->photo;
        $user->phone        = $request->phone;
        $user->save();

        $member                     = Member::where('user_id', $request->id)->first();
        $member->gender             = $request->gender;
        $member->on_behalves_id     = $request->on_behalf ?? null;
        $member->birthday           = date('Y-m-d', strtotime($request->date_of_birth));
        $member->marital_status_id  = $request->marital_status;
        $member->children           = $request->children;
        $member->annual_salary_range_id = $request->annual_salary_range;
        
        if ($member->save()) {
            flash('Member basic info  has been updated successfully')->success();
            return back();
        }
        flash('Sorry! Something went wrong.')->error();
        return back();
    }

    public function language_info_update(Request $request, $id)
    {
        $member                     = Member::where('user_id', $request->id)->first();
        $member->mothere_tongue     = $request->mothere_tongue;
        $member->known_languages    = $request->known_languages;

        if ($member->save()) {
            flash('Member language info has been updated successfully')->success();
            return back();
        }
        flash('Sorry! Something went wrong.')->error();
        return back();
    }

    public function setMemberPassword(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'new_password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ], [
            'new_password.required' => translate('Password is required'),
            'new_password.min' => translate('Minimum 8 characters'),
            'new_password.confirmed' => translate('Password confirmation does not match'),
        ]);

        if ($validator->fails()) {
            flash($validator->errors()->first() ?: translate('Please fix validation errors.'))->error();
            return Redirect::back()->withErrors($validator)->withInput();
        }

        $member = User::findOrFail($id);
        $member->password = Hash::make($request->new_password);
        $member->must_change_password = 1;
        $member->save();

        // Force fresh login with the admin-set temporary password.
        $member->tokens()->delete();

        Log::info('Admin set member password', [
            'action' => 'admin_set_member_password',
            'admin_user_id' => auth()->id(),
            'target_user_id' => $member->id,
            'ip' => request()->ip(),
        ]);

        flash(translate('Member password has been set. User must change it on next login.'))->success();
        return Redirect::back();
    }

    public function show_verification_info ($id)
    {
        $user = User::findOrFail(decrypt($id));
        return view('admin.members.verification_info', compact('user'));
    }

    public function approve_verification($id)
    {
        $user             = User::findOrFail($id);
        $user->approved   = 1;
        if ($user->save()) {

            $status = 'Approved';
            
            // Member verification email send to members
            if ($user->email != null && get_email_template('member_verification_email', 'status')) {
                EmailUtility::member_verification_email($user, $status);
            }

            flash('Member Verified Successfully')->success();
            return redirect()->route('members.index', $user->membership);
        } else {
            flash('Sorry! Something went wrong.')->error();
            return back();
        }
    }
    
    public function reject_verification($id)
    {
        $user             = User::findOrFail($id);
        $user->verification_info   = null;
        if ($user->save()) {
            $status = 'Rejected';
            
            // Member verification email send to members
            if ($user->email != null && get_email_template('member_verification_email', 'status')) {
                EmailUtility::member_verification_email($user, $status);
            }

            flash('Member Verification Rejected.')->success();
            return redirect()->route('members.index', $user->membership);

        } else {
            flash('Sorry! Something went wrong.')->error();
            return back();
        }
    }

    public function deleted_members(Request $request)
    {
        $sort_search        = null;
        $deleted_members    = User::onlyTrashed();
       
        if ($request->has('search')) {
            $sort_search  = trim((string) $request->search);
            $this->applyMemberSearch($deleted_members, $sort_search);
        }
        $deleted_members = $deleted_members->paginate(10);
        return view('admin.members.deleted_members', compact('deleted_members', 'sort_search'));
    }


    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {   
        $user = User::findOrFail($id);

        $user->member()->delete();
        $user->addresses()->delete();
        $user->education()->delete();
        $user->career()->delete();
        $user->physical_attributes()->delete();
        $user->hobbies()->delete();
        $user->attitude()->delete();
        $user->recidency()->delete();
        $user->lifestyles()->delete();
        $user->astrologies()->delete();
        $user->families()->delete();
        $user->partner_expectations()->delete();
        $user->spiritual_backgrounds()->delete();
        $user->happy_story()->delete();
        $user->uploads()->delete();
        
        $chatThreads = ChatThread::where('sender_user_id', $user->id)->orWhere('receiver_user_id', $user->id)->get();
        foreach($chatThreads as $chatThread){
            $chatThread->chats()->delete(); 
        }
        foreach($chatThreads as $chatThread){
            $chatThread->delete(); 
        }

        if (User::destroy($id)) {
            flash('Member has been added to the deleted member list')->success();
        } else {
            flash('Sorry! Something went wrong.')->error();
        }
        return back();
    }

    public function restore_deleted_member($id)
    {
        $user = User::withTrashed()->where('id', $id)->first();
        $user->member()->withTrashed()->restore();
        $user->addresses()->withTrashed()->restore();
        $user->education()->withTrashed()->restore();
        $user->career()->withTrashed()->restore();
        $user->physical_attributes()->withTrashed()->restore();
        $user->hobbies()->withTrashed()->restore();
        $user->attitude()->withTrashed()->restore();
        $user->recidency()->withTrashed()->restore();
        $user->lifestyles()->withTrashed()->restore();
        $user->astrologies()->withTrashed()->restore();
        $user->families()->withTrashed()->restore();
        $user->partner_expectations()->withTrashed()->restore();
        $user->spiritual_backgrounds()->withTrashed()->restore();
        $user->happy_story()->withTrashed()->restore();
        $user->uploads()->withTrashed()->restore();
        
        $chatThreads = ChatThread::withTrashed()->where('sender_user_id', $user->id)->orWhere('receiver_user_id', $user->id)->get();
        foreach($chatThreads as $chatThread){
            $chatThread->chats()->withTrashed()->restore(); 
        }
        foreach($chatThreads as $chatThread){
            $chatThread->restore(); 
        }

        if (User::withTrashed()->where('id', $id)->restore()) {
            flash('Member has been restored successfully')->success();
        } else {
            flash('Sorry! Something went wrong.')->error();
            return back();
        }
        return back();
    }
    public function member_permanemtly_delete($id)
    {
        $user = User::withTrashed()->where('id', $id)->first();

        $uploads = $user->uploads;
        if ($uploads) {
            foreach ($uploads as $upload) {
                if (file_exists(public_path() . '/' . $upload->file_name)) {
                    unlink(public_path() . '/' . $upload->file_name);
                    $upload->withTrashed()->forcedelete();
                }
            }
        }

        $user->addresses()->withTrashed()->forcedelete();
        $user->education()->withTrashed()->forcedelete();
        $user->career()->withTrashed()->forcedelete();
        $user->physical_attributes()->withTrashed()->forcedelete();
        $user->hobbies()->withTrashed()->forcedelete();
        $user->attitude()->withTrashed()->forcedelete();
        $user->recidency()->withTrashed()->forcedelete();
        $user->lifestyles()->withTrashed()->forcedelete();
        $user->astrologies()->withTrashed()->forcedelete();
        $user->families()->withTrashed()->forcedelete();
        $user->partner_expectations()->withTrashed()->forcedelete();
        $user->spiritual_backgrounds()->withTrashed()->forcedelete();
        $user->happy_story()->withTrashed()->forcedelete();
        $user->uploads()->withTrashed()->forcedelete();

        $user->gallery_images()->delete();
        Shortlist::where('user_id', $user->id)->orWhere('shortlisted_by',$user->id)->delete();
        IgnoredUser::where('user_id', $user->id)->orWhere('ignored_by',$user->id)->delete();
        ReportedUser::where('user_id', $user->id)->orWhere('reported_by',$user->id)->delete();
        ExpressInterest::where('user_id', $user->id)->orWhere('interested_by',$user->id)->delete();
        ProfileMatch::where('user_id', $user->id)->orWhere('match_id',$user->id)->delete();
        
        $chatThreads = ChatThread::withTrashed()->where('sender_user_id', $user->id)->orWhere('receiver_user_id', $user->id)->get();
        foreach($chatThreads as $chatThread){
            $chatThread->chats()->withTrashed()->forcedelete(); 
        }

        foreach($chatThreads as $chatThread){
            $chatThread->forcedelete(); 
        }
        
        $user->member()->withTrashed()->forcedelete();
        $user->forcedelete();

        flash(translate('Member permanently deleted successfully'))->success();
        return back();
    }

    public function package_info(Request $request)
    {
        $member = Member::where('user_id', $request->id)->first();
        return view('admin.members.package_modal', compact('member'));
    }

    public function get_package(Request $request)
    {
        $member_id = $request->id;
        $packages  = Package::where('active', 1)->get();
        return view('admin.members.get_package', compact('member_id', 'packages'));
    }

    public function package_do_update(Request $request, $id)
    {

        $member                                 = Member::where('id', $id)->first();
        $package                                = Package::where('id', $request->package_id)->first();
        $member->current_package_id             = $package->id;
        $member->remaining_interest             = $member->remaining_interest + $package->express_interest;
        $member->remaining_photo_gallery        = $member->remaining_photo_gallery + $package->photo_gallery;
        $member->remaining_contact_view         = $member->remaining_contact_view + $package->contact;
        $member->remaining_profile_viewer_view  = $member->remaining_profile_viewer_view + $package->profile_viewers_view;
        $member->remaining_profile_image_view   = $member->remaining_profile_image_view + $package->profile_image_view;
        $member->remaining_gallery_image_view   = $member->remaining_gallery_image_view + $package->gallery_image_view;

        $member->auto_profile_match         = $package->auto_profile_match;
        $member->package_validity           = date('Y-m-d', strtotime($member->package_validity . ' +' . $package->validity . 'days'));
        $membership                         = $package->id == 1 ? 1 : 2;

        if ($member->save()) {
            $user                = User::where('id', $member->user_id)->first();
            $user->membership    = $membership;
            if ($user->save()) {
                flash(translate('Member package has been updated successfully'))->success();
                return redirect()->route('members.index', $membership);
            }
        }
        flash(translate('Sorry! Something went wrong.'))->error();
        return back();
    }

    public function member_wallet_balance_update(Request $request)
    {
        $user = User::where('id', $request->user_id)->first();

        $wallet                   = new Wallet;
        $wallet->user_id          = $user->id;
        $wallet->amount           = $request->wallet_amount;
        $wallet->payment_method   = $request->payment_option;
        $wallet->payment_details  = '';
        $wallet->save();

        if ($request->payment_option == 'added_by_admin') {
            $user->balance = $user->balance + $request->wallet_amount;
        } elseif ($request->payment_option == 'deducted_by_admin') {
            $user->balance = $user->balance - $request->wallet_amount;
        }

        if ($user->save()) {
            flash(translate('Wallet Balance Updated Successfully'))->success();
            return back();
        } else {
            flash(translate('Something Went Wrong!'))->error();
            return back();
        }
    }

    public function block(Request $request)
    {
        $user           = User::findOrFail($request->member_id);
        $user->blocked  = $request->block_status;
        if ($user->save()) {
            $member                 = Member::where('user_id', $user->id)->first();
            $member->blocked_reason = !empty($request->blocking_reason) ? $request->blocking_reason : "";
            if ($member->save()) {

                flash($user->blocked == 1 ? translate('Member Blocked !') : translate('Member Unblocked !'))->success();
                return back();
            }
        }
        flash('Sorry! Something went wrong.')->error();
        return back();
    }

    public function toggleActivation(Request $request)
    {
        $user = User::findOrFail($request->member_id);
        $user->deactivated = $user->deactivated ? 0 : 1;
        $user->save();

        $status = $user->deactivated ? translate('deactivated') : translate('activated');
        flash(translate('Member has been ') . $status . ' ' . translate('successfully!'))->success();
        return back();
    }

    public function blocking_reason(Request $request)
    {
        $blocked_reason = Member::where('user_id', $request->id)->first()->blocked_reason;
        return $blocked_reason;
    }

    // Login by admin as a Member
    public function login($id)
    {
        $user = User::findOrFail(decrypt($id));
        auth()->login($user, true);

        return redirect()->route('dashboard');
    }

    // Member Profile settings Frontend
    public function profile_settings()
    {
        $data['member']                 = User::findOrFail(Auth::user()->id);
        $data['countries']              = Country::where('status', 1)->get();
        $data['religions']              = Religion::all();
        $data['castes']                 = Caste::all();
        $data['family_values']          = FamilyValue::all();
        $data['marital_statuses']       = MaritalStatus::all();
        $data['on_behalves']            = OnBehalf::all();
        $data['languages']              = MemberLanguage::all();
        $data['additional_attributes']  = AdditionalAttribute::where('status', 1)->get();
        $data['annual_salary_ranges']   = AnnualSalaryRange::orderBy('min_salary','asc')->get();

        return view('frontend.member.profile.index', $data);
    }

    public function verification_requests(Request $request)
    {
        $sort_search = $request->search;
        $filter_status = $request->status ?? 'pending';

        $members = User::where('user_type', 'member')
            ->whereNotNull('verification_info');

        if ($filter_status == 'pending') {
            $members = $members->where('approved', 0);
        } elseif ($filter_status == 'approved') {
            $members = $members->where('approved', 1);
        }

        if ($sort_search) {
            $sort_search = trim((string) $sort_search);
            $this->applyMemberSearch($members, $sort_search);
        }

        $members = $members->latest()->paginate(15);
        $this->appendWhatsappMetadataToMembers($members, 'verification');
        return view('admin.members.verification_requests', compact('members', 'sort_search', 'filter_status'));
    }

    public function unapproved_profile_pictures()
    {
        $users = User::where('user_type', 'member')->where('photo_approved', 0)->latest()->paginate(10);
        return view('admin.members.unapproved_member_profile_pictures', compact('users'));
    }

    public function approve_profile_image(Request $request)
    {
        $user = User::findOrFail($request->id);
        $user->photo_approved = 1;
        if ($user->save()) {
            flash(translate('Profile Picture Approved Successfully'))->success();
            return 1;
        }
        return 0;
    }

    // Change Password
    public function change_password()
    {
        return view('frontend.member.password_change');
    }

    public function password_update(Request $request, $id)
    {
        $rules = [
            'old_password'      => ['required'],
            'password'          => ['min:8', 'required_with:confirm_password', 'same:confirm_password'],
            'confirm_password'  => ['min:8'],
        ];

        $messages = [
            'old_password.required'     => translate('Old Password is required'),
            'password.required_with'    => translate('Password and Confirm password are required'),
            'password.same'             => translate('Password and Confirmed password did not matched'),
            'confirm_password.min'      => translate('Max 8 characters'),
        ];

        $validator  = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            flash(translate('Sorry! Something went wrong'))->error();
            return Redirect::back()->withErrors($validator);
        }

        $user = User::findOrFail($id);

        if (Hash::check($request->old_password, $user->password)) {
            $user->password = Hash::make($request->password);
            $user->must_change_password = 0;
            $user->save();
            $user->tokens()->delete();
            flash(translate('Passwoed Updated successfully.'))->success();
            return redirect()->route('member.change_password');
        } else {
            flash(translate('Old password do not matched.'))->error();
            return back();
        }
    }

    public function update_account_deactivation_status(Request $request)
    {
        $user = Auth::user();
        $user->deactivated = $request->deacticvation_status;
        $deacticvation_msg = $request->deacticvation_status == 1 ? translate('deactivated') : translate('reactivated');
        if ($user->save()) {
            flash(translate('Your account ') . $deacticvation_msg . translate(' successfully!'))->success();
            return redirect()->route('dashboard');
        }
        flash(translate('Something Went Wrong!'))->error();
        return back();
    }
    public function account_delete(Request $request)
    {
        $user = auth()->user();
        if ($user) {
            $user->member ?  $user->member->delete() : '';
            Address::where('user_id', $user->id)->delete();
            Education::where('user_id', $user->id)->delete();
            Career::where('user_id', $user->id)->delete();
            PhysicalAttribute::where('user_id', $user->id)->delete();
            Hobby::where('user_id', $user->id)->delete();
            Attitude::where('user_id', $user->id)->delete();
            Recidency::where('user_id', $user->id)->delete();
            Lifestyle::where('user_id', $user->id)->delete();
            Astrology::where('user_id', $user->id)->delete();
            Family::where('user_id', $user->id)->delete();
            PartnerExpectation::where('user_id', $user->id)->delete();
            SpiritualBackground::where('user_id', $user->id)->delete();
            PackagePayment::where('user_id', $user->id)->delete();
            HappyStory::where('user_id', $user->id)->delete();
            Staff::where('user_id', $user->id)->delete();
            ChatThread::where('sender_user_id', auth()->user()->id)->orWhere('receiver_user_id', auth()->user()->id)->delete();
            Upload::where('user_id', $user->id)->delete();
            User::destroy(auth()->user()->id);
            flash(translate('Your account has deleted successfully!'))->success();
            auth()->guard()->logout();
        }
        flash(translate('Something Went Wrong!'))->error();
        return back();
    }

    public function filterbyStatus(Request $request, $status)
    {
        $sort_search  = null;
        $query = User::query();
        $type = $status;
        // Apply filters based on request

        if ($status=='blocked') {
            $query->where('user_type', 'member')->where('blocked', 1);
        }

       if ($status=='deactivated') {
            $query->where('user_type', 'member')->where('deactivated', 1);
        }

        if ($status=='approved') {
            $query->where('user_type', 'member')->where('approved', 1);
        }
        if ($status=='pending') {
            $query->where('user_type', 'member')->where('approved', 0);
        }

       // Apply search filter
        if ($request->has('search')) {
            $sort_search = trim((string) $request->search);
            $this->applyMemberSearch($query, $sort_search);
        }


    // Finally paginate
    $members = $query->paginate(10);
    $this->appendWhatsappMetadataToMembers($members, 'general');

        return view('admin.members.member_types', compact('members', 'sort_search', 'type'));
    }

    /**
     * Send notification to a specific member via selected channels (email, sms, whatsapp, push).
     * Returns JSON so the frontend can handle WhatsApp link opening without popup-blocker issues.
     */
    public function sendNotification(Request $request)
    {
        $request->validate([
            'member_id' => 'required|integer|exists:users,id',
            'title'     => 'required|string|max:255',
            'body'      => 'required|string|max:5000',
            'channels'  => 'required|array|min:1',
            'channels.*'=> 'in:email,sms,whatsapp,push',
        ]);

        $user = User::findOrFail($request->member_id);
        $title   = $request->title;
        $body    = $request->body;
        $channels = $request->channels;
        $results = [];
        $whatsappLink = null;

        // --- EMAIL ---
        if (in_array('email', $channels)) {
            if (!empty($user->email)) {
                try {
                    \Mail::send('emails.index', ['email_body' => $body], function ($message) use ($user, $title) {
                        $message->to($user->email, $user->first_name . ' ' . $user->last_name)
                                ->subject($title)
                                ->from(env('MAIL_FROM_ADDRESS'), env('MAIL_FROM_NAME'));
                    });
                    $results['email'] = 'sent';
                } catch (\Throwable $e) {
                    Log::error('Admin notification email failed: ' . $e->getMessage());
                    $results['email'] = 'failed';
                }
            } else {
                $results['email'] = 'skipped: no email address';
            }
        }

        // --- SMS ---
        if (in_array('sms', $channels)) {
            if (!empty($user->phone)) {
                try {
                    $smsText = $title . "\n\n" . $body;
                    sendSMS($user->phone, env('APP_NAME'), $smsText, '');
                    $results['sms'] = 'sent';
                } catch (\Throwable $e) {
                    Log::error('Admin notification SMS failed: ' . $e->getMessage());
                    $results['sms'] = 'failed';
                }
            } else {
                $results['sms'] = 'skipped: no phone number';
            }
        }

        // --- WHATSAPP ---
        if (in_array('whatsapp', $channels)) {
            $waDigits = $this->normalizeWhatsappPhone($user->phone);
            if ($waDigits) {
                $waMessage = "*{$title}*\n\n{$body}";
                $whatsappLink = 'https://web.whatsapp.com/send?phone=' . $waDigits . '&text=' . urlencode($waMessage);
                $results['whatsapp'] = 'link_generated';
            } else {
                $results['whatsapp'] = 'skipped: invalid or missing phone number';
            }
        }

        // --- PUSH NOTIFICATION (via Soketi WebSocket + Database) ---
        if (in_array('push', $channels)) {
            try {
                // 1. Store in database notifications table so it appears in user's notification list
                $notifyId = unique_notify_id();
                \Illuminate\Support\Facades\Notification::send($user, new \App\Notifications\DbStoreNotification(
                    'admin_notification',
                    $notifyId,
                    auth()->id(),
                    $user->id,
                    $body,
                    'notifications'
                ));

                // 2. Broadcast via Soketi so user gets real-time popup
                broadcast(new \App\Events\NotificationReceived($user->id, [
                    'type'    => 'admin_notification',
                    'title'   => $title,
                    'body'    => $body,
                    'message' => $body,
                    'sent_by' => auth()->user()->first_name . ' ' . auth()->user()->last_name,
                ]));

                $results['push'] = 'sent';
            } catch (\Throwable $e) {
                Log::error('Admin notification push (Soketi) failed: ' . $e->getMessage());
                $results['push'] = 'failed';
            }
        }

        // Build result summary
        $successChannels = [];
        $failedChannels  = [];
        $skippedChannels = [];
        foreach ($results as $ch => $status) {
            if ($status === 'sent' || $status === 'link_generated') {
                $successChannels[] = ucfirst($ch);
            } elseif (str_starts_with($status, 'skipped')) {
                $skippedChannels[] = ucfirst($ch) . ' (' . substr($status, 9) . ')';
            } else {
                $failedChannels[] = ucfirst($ch);
            }
        }

        $msg = '';
        if (!empty($successChannels)) {
            $msg .= 'Notification sent via: ' . implode(', ', $successChannels) . '. ';
        }
        if (!empty($skippedChannels)) {
            $msg .= 'Skipped: ' . implode(', ', $skippedChannels) . '. ';
        }
        if (!empty($failedChannels)) {
            $msg .= 'Failed: ' . implode(', ', $failedChannels) . '.';
        }

        // Return JSON for AJAX handling (WhatsApp link + results)
        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success'       => empty($failedChannels),
                'message'       => trim($msg),
                'results'       => $results,
                'whatsapp_link' => $whatsappLink,
            ]);
        }

        // Fallback for non-AJAX
        if (!empty($failedChannels)) {
            flash($msg)->error();
        } elseif (!empty($skippedChannels) && empty($successChannels)) {
            flash($msg)->warning();
        } else {
            flash($msg)->success();
        }
        return back();
    }

    private function appendWhatsappMetadataToMembers($members, string $context = 'general'): void
    {
        if (!method_exists($members, 'getCollection')) {
            return;
        }

        $members->getCollection()->transform(function ($member) use ($context) {
            $whatsapp = $this->buildWhatsappLink($member, $context);

            $member->whatsapp_available = $whatsapp['available'];
            $member->whatsapp_link = $whatsapp['link'];
            $member->whatsapp_unavailable_reason = $whatsapp['reason'];

            return $member;
        });
    }

    private function normalizeWhatsappPhone(?string $rawPhone): ?string
    {
        $phone = trim((string) $rawPhone);
        if ($phone === '') {
            return null;
        }

        $phone = str_replace([' ', '-', '(', ')', '.'], '', $phone);
        if (strpos($phone, '00') === 0) {
            $phone = '+' . substr($phone, 2);
        }

        $normalized = null;
        if (strpos($phone, '+') === 0) {
            $digits = preg_replace('/\D+/', '', substr($phone, 1));
            $normalized = $digits !== '' ? ('+' . $digits) : null;
        } else {
            $digits = preg_replace('/\D+/', '', $phone);

            if (strlen($digits) === 11 && strpos($digits, '03') === 0) {
                $normalized = '+92' . substr($digits, 1);
            } elseif (strlen($digits) === 10 && strpos($digits, '3') === 0) {
                $normalized = '+92' . $digits;
            } elseif (strlen($digits) === 11 && strpos($digits, '0') === 0) {
                $normalized = '+92' . substr($digits, 1);
            } elseif (strlen($digits) === 10) {
                $normalized = '+92' . $digits;
            } elseif (strlen($digits) > 10 && strlen($digits) <= 15) {
                $normalized = '+' . $digits;
            }
        }

        if ($normalized === null) {
            return null;
        }

        $waDigits = ltrim($normalized, '+');
        if (!ctype_digit($waDigits)) {
            return null;
        }

        $length = strlen($waDigits);
        if ($length < 10 || $length > 15) {
            return null;
        }

        return $waDigits;
    }

    private function buildWhatsappLink(User $member, string $context = 'general'): array
    {
        $name = trim(($member->first_name ?? '') . ' ' . ($member->last_name ?? ''));
        if ($name === '') {
            $name = translate('Member');
        }

        $code = $member->code ?? (string) $member->id;

        $message = $context === 'verification'
            ? "Hello {$name}, this is Doctor Marriage Bureau verification team. Your submitted verification document(s) for profile ({$code}) need correction. Please upload clear and correct documents in your Complete Profile section."
            : "Hello {$name}, this is Doctor Marriage Bureau support team. We are contacting you regarding your profile ({$code}). Please reply here for assistance.";

        $waDigits = $this->normalizeWhatsappPhone($member->phone);
        if ($waDigits === null) {
            return [
                'available' => false,
                'link' => null,
                'reason' => translate('WhatsApp unavailable: invalid or missing phone number'),
                'message' => $message,
            ];
        }

        return [
            'available' => true,
            'link' => 'https://web.whatsapp.com/send?phone=' . $waDigits . '&text=' . urlencode($message),
            'reason' => null,
            'message' => $message,
        ];
    }

    private function applyMemberSearch($query, string $search)
    {
        if ($search === '') {
            return;
        }

        $normalizedPhone = preg_replace('/\D+/', '', $search);
        $searchLike = '%' . $search . '%';

        $query->where(function ($q) use ($search, $searchLike, $normalizedPhone) {
            $q->where('code', 'like', $searchLike)
                ->orWhere('first_name', 'like', $searchLike)
                ->orWhere('last_name', 'like', $searchLike)
                ->orWhere('email', 'like', $searchLike)
                ->orWhere('phone', 'like', $searchLike)
                ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", [$searchLike])
                ->orWhereRaw("CAST(id AS CHAR) LIKE ?", [$searchLike]);

            if (!empty($normalizedPhone)) {
                $q->orWhereRaw("REPLACE(REPLACE(REPLACE(REPLACE(phone, '+', ''), ' ', ''), '-', ''), '(', '') LIKE ?", ['%' . $normalizedPhone . '%']);
            }

            if (ctype_digit($search)) {
                $q->orWhere('id', (int) $search);
            }
        });
    }
}

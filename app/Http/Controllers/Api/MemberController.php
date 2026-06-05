<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Career;
use App\Models\Member;
use App\Models\Address;
use App\Models\IgnoredUser;
use App\Models\ReportedUser;
use Illuminate\Http\Request;
use App\Models\PhysicalAttribute;
use App\Models\SpiritualBackground;
use App\Http\Controllers\Api\Controller;
use App\Http\Resources\ActiveUserResource;
use App\Http\Resources\IgnoredUserResource;
use App\Http\Resources\PackageResource;
use App\Models\ExpressInterest;
use App\Models\Package;
use App\Models\Setting;
use App\Models\Shortlist;
use App\Models\ViewGalleryImage;
use App\Utility\MemberUtility;
use Laravel\Sanctum\PersonalAccessToken;

class MemberController extends Controller
{
    private function isOptionalVerificationField($element): bool
    {
        $label = strtolower(trim((string) ($element->label ?? '')));

        return in_array($label, [
            'professional degree',
            'degree',
            'medical degree',
            'qualification',
        ], true);
    }

    public function member_listing(Request $request)
    {
        $authUser = auth()->user();
        $age_from       = ($request->age_from != null) ? $request->age_from : null;
        $age_to         = ($request->age_to != null) ? $request->age_to : null;
        $member_code    = ($request->member_code != null) ? $request->member_code : null;
        $marital_status = ($request->marital_status != null) ? $request->marital_status : null;
        $religion_id    = ($request->religion_id != null) ? $request->religion_id : null;
        $caste_id       = ($request->caste_id != null) ? $request->caste_id : null;
        $sub_caste_id   = ($request->sub_caste_id != null) ? $request->sub_caste_id : null;
        $mother_tongue  = ($request->mother_tongue != null) ? $request->mother_tongue : null;
        $profession     = ($request->profession != null) ? $request->profession : null;
        $country_id     = ($request->country_id != null) ? $request->country_id : null;
        $state_id       = ($request->state_id != null) ? $request->state_id : null;
        $city_id        = ($request->city_id != null) ? $request->city_id : null;
        $min_height     = ($request->min_height != null) ? $request->min_height : null;
        $max_height     = ($request->max_height != null) ? $request->max_height : null;
        $member_type    = ($request->member_type != null) ? $request->member_type : 0;
        $page           = max((int) $request->input('page', 1), 1);
        $perPage        = min(max((int) $request->input('per_page', 24), 1), 48);

        $users_query = User::query();
        $users_query->orderBy('created_at', 'desc')
            ->where('user_type', 'member')
            ->where('id', '!=', $authUser->id)
            ->where('blocked', 0)
            ->where('deactivated', 0)
            ->where('permanently_delete', 0);

        // Gender Check
        $authGender = optional($authUser->member)->gender;
        if ($authGender !== null && $authGender !== '') {
            $users_query->whereHas('member', function ($query) use ($authGender) {
                $query->where('gender', '!=', $authGender)
                    ->where('is_visible', 1);
            });
        } else {
            $users_query->whereHas('member', function ($query) {
                $query->where('is_visible', 1);
            });
        }

        // Ignored member and ignored by member check
        $users_query->whereNotIn("id", function ($query) use ($authUser) {
            $query->select('user_id')
                ->from('ignored_users')
                ->where(function ($ignored) use ($authUser) {
                    $ignored->where('ignored_by', $authUser->id)
                        ->orWhere('user_id', $authUser->id);
                });
        })
            ->whereNotIn("id", function ($query) use ($authUser) {
                $query->select('ignored_by')
                    ->from('ignored_users')
                    ->where(function ($ignored) use ($authUser) {
                        $ignored->where('ignored_by', $authUser->id)
                            ->orWhere('user_id', $authUser->id);
                    });
            });

        // Membership Check
        if ($member_type == 1 || $member_type == 2) {
            $users_query->where('membership', $member_type);
        }

        // Member Approved Check
        if (get_setting('member_verification') == 1) {
            $users_query->where('approved', 1);
        }

        // Sort By age
        if (!empty($age_from)) {
            $age = $age_from + 1;
            $start = date('Y-m-d', strtotime("- $age years"));
            $users_query->whereHas('member', function ($query) use ($start) {
                $query->where('birthday', '<=', $start);
            });
        }
        if (!empty($age_to)) {
            $age = $age_to + 1;
            $end = date('Y-m-d', strtotime("- $age years +1 day"));
            $users_query->whereHas('member', function ($query) use ($end) {
                $query->where('birthday', '>=', $end);
            });
        }

        // Search by Member Code
        if (!empty($member_code)) {
            $users_query->where('code', $member_code);
        }

        // Sort by Matital Status
        if ($marital_status != null) {
            $users_query->whereHas('member', function ($query) use ($marital_status) {
                $query->where('marital_status_id', $marital_status);
            });
        }

        // Sort By religion
        if (!empty($sub_caste_id)) {
            $users_query->whereHas('spiritual_backgrounds', function ($query) use ($sub_caste_id) {
                $query->where('sub_caste_id', $sub_caste_id);
            });
        } elseif (!empty($caste_id)) {
            $users_query->whereHas('spiritual_backgrounds', function ($query) use ($caste_id) {
                $query->where('caste_id', $caste_id);
            });
        } elseif (!empty($religion_id)) {
            $users_query->whereHas('spiritual_backgrounds', function ($query) use ($religion_id) {
                $query->where('religion_id', $religion_id);
            });
        }
        // Profession
        elseif (!empty($profession)) {
            $users_query->whereHas('career', function ($query) use ($profession) {
                $query->where('designation', 'like', '%' . $profession . '%');
            });
        }

        // Sort By location
        if (!empty($city_id)) {
            $users_query->whereHas('addresses', function ($query) use ($city_id) {
                $query->where('city_id', $city_id);
            });
        } elseif (!empty($state_id)) {
            $users_query->whereHas('addresses', function ($query) use ($state_id) {
                $query->where('state_id', $state_id);
            });
        } elseif (!empty($country_id)) {
            $users_query->whereHas('addresses', function ($query) use ($country_id) {
                $query->where('country_id', $country_id);
            });
        }

        // Sort By Mother Tongue
        if ($mother_tongue != null) {
            $users_query->whereHas('member', function ($query) use ($mother_tongue) {
                $query->where('mothere_tongue', $mother_tongue);
            });
        }

        // Sort by Height
        if (!empty($min_height)) {
            $users_query->whereHas('physical_attributes', function ($query) use ($min_height) {
                $query->where('height', '>=', $min_height);
            });
        }
        if (!empty($max_height)) {
            $users_query->whereHas('physical_attributes', function ($query) use ($max_height) {
                $query->where('height', '<=', $max_height);
            });
        }

        $members = $users_query
            ->with([
                'member.marital_status',
                'addresses.country',
                'career',
                'education',
                'physical_attributes',
                'spiritual_backgrounds.religion',
                'spiritual_backgrounds.caste',
            ])
            ->skip(($page - 1) * $perPage)
            ->take($perPage + 1)
            ->get();
        $hasMore = $members->count() > $perPage;
        $members = $members->take($perPage);

        MemberUtility::primeUserCache($members);
        MemberUtility::primeVisibilitySnapshots($members->pluck('id'));

        $data['members'] = ActiveUserResource::collection($members);
        $data['pagination'] = [
            'page' => $page,
            'per_page' => $perPage,
            'has_more' => $hasMore,
            'next_page' => $hasMore ? $page + 1 : null,
        ];
        $data['age_from'] = $age_from;
        $data['age_to'] = $age_to;
        $data['member_code'] = $member_code;
        $data['marital_status'] = $marital_status;
        $data['religion_id'] = $religion_id;
        $data['caste_id'] = $caste_id;
        $data['sub_caste_id'] = $sub_caste_id;
        $data['mother_tongue'] = $mother_tongue;
        $data['profession'] = $profession;
        $data['country_id'] = $country_id;
        $data['state_id'] = $state_id;
        $data['city_id'] = $city_id;
        $data['min_height'] = $min_height;
        $data['max_height'] = $max_height;
        $data['member_type'] = $member_type;

        return $this->response_data($data);
    }

    public function package_details()
    {
        $package_id = auth()->user()->member->current_package_id;
        $package = Package::where('id', $package_id)->first();
        return new PackageResource($package);
    }

    public function ignored_user_list()
    {
        return IgnoredUserResource::collection(IgnoredUser::where('ignored_by', auth()->user()->id)->latest()->paginate(10))->additional([
            'result' => true
        ]);
    }

    public function add_to_ignore_list(Request $request)
    {
        $targetUserId = (int) $request->user_id;
        if ($targetUserId === (int) auth()->id()) {
            return $this->failure_message('You cannot ignore your own profile.');
        }

        if (User::find($targetUserId)) {
            try {
                IgnoredUser::firstOrCreate([
                    'user_id' => $targetUserId,
                    'ignored_by' => auth()->user()->id,
                ]);

                return $this->success_message('You have ignored this member');
            } catch (\Throwable $th) {
                return $this->failure_message('Something went wrong');
            }
        }
        return $this->failure_message('Invalid Member to ignore.');
    }

    public function remove_from_ignored_list(Request $request)
    {
        $ignored_user = IgnoredUser::where('user_id', $request->user_id)->where('ignored_by', auth()->user()->id)->first();
        if ($ignored_user) {
            IgnoredUser::destroy($ignored_user->id);
            return $this->success_message('You have removed this member from your ignored list');
        }
        return $this->failure_message('Something went wrong');
    }

    public function report_member(Request $request)
    {
        $reportedUser = ReportedUser::where('user_id', $request->user_id)
            ->where('reported_by', auth()->user()->id)->first();

        if ($reportedUser) {
            return $this->failure_message('Already reported this member');
        }

        if (User::find($request->user_id)) {
            ReportedUser::create($request->only('reason') + [
                'user_id' => $request->user_id,
                'reported_by' => auth()->user()->id
            ]);
            return $this->success_message('Reported to this member successfully.');
        }
        return $this->failure_message('Invalid Member to Report.');
    }

    public function update_account_deactivation_status(Request $request)
    {
        $user = User::findOrFail(auth()->user()->id);
        $user->deactivated = $request->deacticvation;
        $user->save();

        $deacticvation_msg = $request->deacticvation == 1 ? translate('deactivated') : translate('reactivated');
        return $this->success_message('Your account ' . $deacticvation_msg . ' successfully!');
    }

    public function member_info($id)
    {
        $data = array();
        $profileUser = User::with('member')->find($id);
        if (!$profileUser) {
            return response()->json([
                'result' => false,
                'message' => 'This profile is not available.',
            ], 404);
        }

        if ((int) auth()->id() !== (int) $profileUser->id && (int) ($profileUser->member?->is_visible ?? 1) !== 1) {
            return response()->json([
                'result' => false,
                'message' => 'This profile is not available.',
                'hidden' => true,
            ], 404);
        }

        $shortlist = Shortlist::where('user_id', $id)->where('shortlisted_by', auth()->id())->first();
        $profile_reported = ReportedUser::where('user_id', $id)->where('reported_by', auth()->id())->first();
        $photo_request_info = MemberUtility::member_profile_photo_request_info($id);
        $gallery_request_info = MemberUtility::member_gallery_image_request_info($id);
        $do_interest = ExpressInterest::where('user_id', $id)->where('interested_by', auth()->id())->first();
        $received_interest = ExpressInterest::where('user_id', auth()->id())->where('interested_by', $id)->first();


        if ($do_interest && $received_interest) {
            $isAccepted = ((int) $do_interest->status === 1) || ((int) $received_interest->status === 1);
            $latestUpdatedAt = $do_interest->updated_at >= $received_interest->updated_at
                ? $do_interest->updated_at
                : $received_interest->updated_at;

            $data['interest_status'] = $isAccepted ? 'mutual' : 'sent interest';
            $data['interest_text'] = $isAccepted ? 'Proposal Accepted' : 'Proposal Sent';
            $data['proposal_status'] = $isAccepted ? 'sent_accepted' : 'sent_pending';
            $data['proposal_updated_at'] = optional($latestUpdatedAt)->toIso8601String();
        } elseif ($do_interest) {
            $data['interest_status'] = 'sent interest';
            $data['interest_text'] = $do_interest->status == 0 ? 'Proposal Sent' : 'Proposal Accepted';
            $data['proposal_status'] = $do_interest->status == 0 ? 'sent_pending' : 'sent_accepted';
            $data['proposal_updated_at'] = optional($do_interest->updated_at)->toIso8601String();
        } elseif ($received_interest) {
            $data['interest_status'] = 'received interest';
            $data['interest_text'] = $received_interest->status == 0 ? 'Reply to Proposal' : 'You Accepted Proposal';
            $data['proposal_status'] = $received_interest->status == 0 ? 'received_pending' : 'received_accepted';
            $data['proposal_updated_at'] = optional($received_interest->updated_at)->toIso8601String();
        } else {
            $data['interest_status'] = 'no interest';
            $data['interest_text'] = 'Proposal';
            $data['proposal_status'] = 'none';
            $data['proposal_updated_at'] = null;
        }
        $data['shortlist_status']    = $shortlist ? 1 : 0;
        $data['report_status']        = $profile_reported ? true : false;
        $data['profile_view_resquest_status']   = $photo_request_info['profile_photo_request_approved'];
        $data['profile_photo_request_state']     = $photo_request_info['profile_photo_request_state'];
        $data['profile_photo_request_text']      = $photo_request_info['profile_photo_request_text'];
        $data['profile_photo_request_requested'] = $photo_request_info['profile_photo_request_requested'];
        $data['profile_photo_request_approved']  = $photo_request_info['profile_photo_request_approved'];
        $data['profile_photo_request_required']  = $photo_request_info['profile_photo_request_required'];
        $data['profile_photo_accessible']        = $photo_request_info['profile_photo_accessible'];
        $data['profile_photo_exists']            = $photo_request_info['profile_photo_exists'];
        $data['profile_photo_blur']              = MemberUtility::member_profile_photo_blur($id);
        $data['gallery_image_request_state']     = $gallery_request_info['gallery_image_request_state'];
        $data['gallery_image_request_text']      = $gallery_request_info['gallery_image_request_text'];
        $data['gallery_image_request_requested'] = $gallery_request_info['gallery_image_request_requested'];
        $data['gallery_image_request_approved']  = $gallery_request_info['gallery_image_request_approved'];
        $data['gallery_image_request_required']   = $gallery_request_info['gallery_image_request_required'];
        $data['gallery_image_accessible']        = $gallery_request_info['gallery_image_accessible'];
        $data['gallery_image_exists']            = $gallery_request_info['gallery_image_exists'];
        $data['gallery_view_resquest_status']   = $gallery_request_info['gallery_image_request_approved'];

        return $this->response_data($data);
    }

    public function member_validate(Request $request)
    {

        $false_response = [
            "result" => false,
            "user" =>   [
                'member_name' => "",
                'member_email' => "",
                'member_photo' => "",
                'remaining_interest' => "",
                'remaining_contact_view' => "",
                'remaining_photo_gallery' => "",
                'remaining_profile_image_view' => "",
                'remaining_gallery_image_view' => "",
                'current_package_info' => ""
            ]
        ];

        $token = PersonalAccessToken::findToken($request->bearerToken());
        if (!$token) {
            return response()->json($false_response);
        }

        $user = $token->tokenable;
        if ($user == null) {
            return response()->json($false_response);
        }

        $data['member_name'] = $user->first_name . ' ' . $user->last_name;
        $data['member_email'] = $user->email;
        $data['member_photo'] = uploaded_asset($user->photo) !== null ? uploaded_asset($user->photo) : gender_avatar($user?->member);
        $data['remaining_interest'] = get_remaining_package_value($user->id, 'remaining_interest');
        $data['remaining_contact_view'] = get_remaining_package_value($user->id, 'remaining_contact_view');
        $data['remaining_photo_gallery'] = get_remaining_package_value($user->id, 'remaining_photo_gallery');
        $data['remaining_profile_image_view'] = (get_setting('profile_picture_privacy') == 'only_me') ? get_remaining_package_value($user->id, 'remaining_profile_image_view') : '';
        $data['remaining_gallery_image_view'] = (get_setting('gallery_image_privacy') == 'only_me') ? get_remaining_package_value($user->id, 'remaining_gallery_image_view') : '';

        $member = $user->member;
        $package = $member?->package;
        $current_package_info = array(
            'package_id' => $package?->id,
            'package_name' => $package?->name ?? translate('No active package'),
            'package_expiry' => ($member && $package && package_validity($user->id))
                ? date('d.m.Y', strtotime($member->package_validity))
                : translate('Expired'),
        );
        $data['current_package_info'] = $current_package_info;

        return $this->response_data($data);
    }

    public function getVerifyForm()
    {
        $user = auth()->user();
        if ($user->verification_info == null) {
            $formData = get_setting('verification_form');
            return response()->json(json_decode($formData));
        } else {
            $status = $user->approved == 1 ? 'approved' : 'pending';
            return response()->json([
                'result' => false,
                'verification_status' => $status,
                'message' => $status === 'approved'
                    ? translate('Your identity has been verified and approved by the platform administration.')
                    : translate('Your verification request is under review. We will notify you once it is approved.'),
            ]);
        }
    }

     public function isApproved(){
        $user = User::where('id',  auth()->user()->id)->first();
        $verification_info = false;
        if($user->verification_info != null){
            $verification_info = true;
        }
        return response()->json(['is_approved' => $user->approved, 'verification_info' => $verification_info]);
    }


    public function store_verification_info(Request $request)
    {
        $user = auth()->user();

        // Check if already submitted and pending/approved
        if ($user->verification_info !== null) {
            if ($user->approved == 1) {
                return response()->json([
                    'result' => true,
                    'error_code' => 'already_approved',
                    'verification_status' => 'approved',
                    'message' => translate('Your identity has already been verified and approved. No further action is needed.'),
                ]);
            }
            return response()->json([
                'result' => true,
                'error_code' => 'already_pending',
                'verification_status' => 'pending',
                'message' => translate('Your verification is already under review. Please wait for the administration to process your submission.'),
            ]);
        }

        try {
            $setting = Setting::where('type', 'verification_form')->first();
            if (!$setting || !$setting->value) {
                return response()->json([
                    'result' => false,
                    'error_code' => 'form_unavailable',
                    'message' => translate('Verification form is not configured. Please contact support.'),
                ]);
            }

            $formFields = json_decode($setting->value);
            if (!$formFields || !is_array($formFields)) {
                return response()->json([
                    'result' => false,
                    'error_code' => 'form_invalid',
                    'message' => translate('Verification form configuration is invalid. Please contact support.'),
                ]);
            }

            $data = array();
            $i = 0;
            foreach ($formFields as $key => $element) {
                $item = array();
                if ($element->type == 'text') {
                    $item['type'] = 'text';
                    $item['label'] = $element->label;
                    $item['value'] = $request['element_' . $i] ?? '';
                } elseif ($element->type == 'select' || $element->type == 'radio') {
                    $item['type'] = 'select';
                    $item['label'] = $element->label;
                    $item['value'] = $request['element_' . $i] ?? '';
                } elseif ($element->type == 'multi_select') {
                    $item['type'] = 'multi_select';
                    $item['label'] = $element->label;
                    $item['value'] = json_encode(explode(',', $request['element_' . $i] ?? ''));
                } elseif ($element->type == 'file') {
                    $item['type'] = 'file';
                    $item['label'] = $element->label;
                    $file = $request->file('element_' . $i);
                    if (!$file) {
                        if ($this->isOptionalVerificationField($element)) {
                            $item['value'] = '';
                            array_push($data, $item);
                            $i++;
                            continue;
                        }

                        return response()->json([
                            'result' => false,
                            'error_code' => 'missing_document',
                            'message' => translate('Please upload the required document: :label', ['label' => $element->label]),
                        ]);
                    }
                    if (!$file->isValid()) {
                        return response()->json([
                            'result' => false,
                            'error_code' => 'invalid_document_upload',
                            'message' => translate('The uploaded file for :label is invalid or exceeded upload limits. Please retry with a smaller file.', ['label' => $element->label]),
                        ], 422);
                    }
                    $item['value'] = $file->store('uploads/verification_form');
                }
                array_push($data, $item);
                $i++;
            }

            $user->verification_info = json_encode($data);
            $user->approved = 0;
            if ($user->save()) {
                return $this->success_message(translate('Your verification request has been submitted successfully! We will review it shortly.'));
            }

            return response()->json([
                'result' => false,
                'error_code' => 'save_failed',
                'message' => translate('Could not save your verification data. Please try again.'),
            ]);
        } catch (\Exception $e) {
            \Log::error('Verification submission error: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'result' => false,
                'error_code' => 'server_error',
                'message' => translate('An unexpected error occurred while processing your verification. Please try again or contact support.'),
            ], 500);
        }
    }

}

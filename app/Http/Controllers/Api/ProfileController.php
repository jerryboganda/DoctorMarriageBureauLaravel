<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Http\Controllers\ProfileMatchController;
use App\Http\Requests\AstrologyRequest;
use App\Http\Requests\PartnerExpectationRequest;
use App\Http\Requests\ProfileRequest;
use App\Http\Resources\CareerResource;
use App\Http\Resources\EducationResource;
use App\Http\Resources\GalleryImage\RequestedGalleryImage;
use App\Http\Resources\GalleryImageResource;
use App\Http\Resources\MatchedProfileResource;
use App\Http\Resources\Profile\LanguageResource;
use App\Http\Resources\PublicProfile\AboutUser;
use App\Http\Resources\PublicProfile\AddressResource;
use App\Http\Resources\PublicProfile\AstronomicInformation;
use App\Http\Resources\PublicProfile\AttitudesBehaviors;
use App\Http\Resources\PublicProfile\BasicInformation;
use App\Http\Resources\PublicProfile\FamilyInformation;
use App\Http\Resources\PublicProfile\HobbiesInterests;
use App\Http\Resources\PublicProfile\LifeStyleResource;
use App\Http\Resources\PublicProfile\PartnerExpectationResource;
use App\Http\Resources\PublicProfile\PhysicalAttributes;
use App\Http\Resources\PublicProfile\ResidenceInformation;
use App\Http\Resources\PublicProfile\SpiritualSocialBackground;
use App\Models\Address;
use App\Models\AnnualSalaryRange;
use App\Models\Astrology;
use App\Models\Attitude;
use App\Models\Career;
use App\Models\Caste;
use App\Models\ChatThread;
use App\Models\City;
use App\Models\Country;
use App\Models\Education;
use App\Models\ExpressInterest;
use App\Models\Family;
use App\Models\FamilyValue;
use App\Models\GalleryImage;
use App\Models\HappyStory;
use App\Models\Hobby;
use App\Models\IgnoredUser;
use App\Models\Lifestyle;
use App\Models\MaritalStatus;
use App\Models\Member;
use App\Models\MemberLanguage;
use App\Models\OnBehalf;
use App\Models\PackagePayment;
use App\Models\PartnerExpectation;
use App\Models\PhysicalAttribute;
use App\Models\ProfileOptionValue;
use App\Models\ProfileMatch;
use App\Models\ProfileViewer;
use App\Models\Recidency;
use App\Models\Religion;
use App\Models\ReportedUser;
use App\Models\Sect;
use App\Models\Setting;
use App\Models\Shortlist;
use App\Models\SpiritualBackground;
use App\Models\Staff;
use App\Models\State;
use App\Models\SubCaste;
use App\Models\FieldVisibilitySetting;
use App\Models\ViewContact;
use App\Models\ViewGalleryImage;
use App\Models\User;
use App\Models\ViewProfilePicture;
use App\Utility\PhoneUtility;
use Illuminate\Auth\Events\Validated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use App\Notifications\DbStoreNotification;
use App\Services\FirbaseNotification;
use Kutia\Larafirebase\Facades\Larafirebase;
use PDF;
use Notification;

class ProfileController extends Controller
{
    public function profile_settings()
    {
        $member = User::findOrFail(auth()->user()->id);
        $countries = Country::where('status', 1)->orderByRaw("CASE WHEN code = 'PK' THEN 0 ELSE 1 END")->orderBy('name')->get();
        $states = State::all();
        $cities = City::all();
        $religions = Religion::all();
        $castes = Caste::all();
        $sub_castes = SubCaste::all();
        $family_values = FamilyValue::all();
        $marital_statuses = MaritalStatus::all();
        $on_behalves = OnBehalf::all();
        $languages = MemberLanguage::all();

        return response()->json([
            'result' => true,
            'member' => $member,
            'countries' => $countries,
            'states' => $states,
            'cities' => $cities,
            'religions' => $religions,
            'castes' => $castes,
            'sub_castes' => $sub_castes,
            'family_values' => $family_values,
            'marital_statuses' => $marital_statuses,
            'on_behalves' => $on_behalves,
            'languages' => $languages,
        ]);
    }

    public function get_introduction()
    {
        return (new AboutUser(auth()->user()))->additional([
            'result' => true
        ]);
    }

    public function get_email()
    {
        $data['email'] = auth()->user()->email;
        return $this->response_data($data);
    }

    public function introduction_update(Request $request)
    {
        $member = Member::where('user_id', auth()->id())->first();
        $member->introduction = $request->introduction;
        $member->save();
        return $this->success_message('Introduction updated successfully!');
    }

    public function get_basic_info()
    {
        return (new BasicInformation(auth()->user()))->additional([
            'result' => true
        ]);
        ;
    }

    public function basic_info_update(ProfileRequest $request)
    {
        if ($request->email == null && $request->phone == null) {
            return response()->json('Email and Phone number both can not be null. ');
        }

        $user = User::findOrFail(auth()->id());
        // image upload
        $photo = null;
        if ($request->hasFile('photo')) {
            $photo = upload_api_file($request->file('photo'));
            $user->photo = $photo;
        }

        $user->first_name = $request->first_name;
        $user->last_name = $request->last_name;
        if (
            Setting::where('type', 'profile_picture_approval_by_admin')->first()->value &&
            $photo &&
            auth()->user()->user_type == 'member'
        ) {
            $user->photo_approved = 0;
        }

        $user->phone = PhoneUtility::normalize($request->phone);
        $user->save();
        $member = Member::where('user_id', $user->id)->first();
        $member->gender = $request->gender;
        $member->on_behalves_id = $request->on_behalf;
        $member->birthday = date('Y-m-d', strtotime($request->date_of_birth));
        $member->marital_status_id = $request->marital_status;
        $member->children = $request->children;
        $member->save();
        return $this->success_message('Member basic info  has been updated successfully.');
    }

    public function present_address()
    {
        $present_address = Address::where('user_id', auth()->id())->where('type', 'present')->first();
        if ($present_address) {
            return (new AddressResource($present_address))->additional([
                'result' => true
            ]);
        } else {
            return $this->failure_data($present_address);

            // return $this->failure_message('No information has been added for this section yet.');
        }
    }
    public function permanent_address()
    {
        $permanent_address = Address::where('user_id', auth()->id())->where('type', 'permanent')->first();
        if ($permanent_address) {
            return (new AddressResource($permanent_address))->additional([
                'result' => true
            ]);
        } else {
            // return $this->failure_message('No information has been added for this section yet.');
            return $this->failure_data($permanent_address);
        }
    }

    public function address_update(Request $request)
    {
        $this->validate($request, [
            'country_id' => ['required'],
            'state_id' => ['required'],
            'city_id' => ['required'],
            'postal_code' => ['required', 'numeric'],
        ]);
        $address = Address::where('user_id', auth()->id())->where('type', $request->address_type)->first();
        if (empty($address)) {
            $address = new Address();
            $address->user_id = auth()->id();
        }
        $address->country_id = $request->country_id;
        $address->state_id = $request->state_id;
        $address->city_id = $request->city_id;
        $address->postal_code = $request->postal_code;
        $address->type = $request->address_type;
        $address->save();
        return $this->success_message('Address info has been updated successfully');
    }

    public function physical_attributes()
    {
        if (auth()->user()->physical_attributes) {
            return (new PhysicalAttributes(auth()->user()->physical_attributes))->additional([
                'result' => true
            ]);
        } else {
            return $this->failure_message('No information has been added for this section yet.');
        }
    }
    public function physical_attributes_update(Request $request)
    {
        $this->validate($request, [
            'height' => ['required', 'numeric', 'between:0,9.99'],
            'weight' => ['required', 'numeric', 'between:0,999.99'],
            'eye_color' => ['required', 'max:50'],
            'hair_color' => ['required', 'max:50'],
            'complexion' => ['required', 'max:50'],
            'blood_group' => ['required', 'max:3'],
            'body_type' => ['required', 'max:50'],
            'body_art' => ['required', 'max:50'],
            'disability' => ['max:255'],
        ]);

        $physical_attribute = PhysicalAttribute::where('user_id', auth()->id())->first();
        if (empty($physical_attribute)) {
            $physical_attribute = new PhysicalAttribute;
            $physical_attribute->user_id = auth()->id();
        }
        $physical_attribute->height = $request->height;
        $physical_attribute->weight = $request->weight;
        $physical_attribute->eye_color = $request->eye_color;
        $physical_attribute->hair_color = $request->hair_color;
        $physical_attribute->complexion = $request->complexion;
        $physical_attribute->blood_group = $request->blood_group;
        $physical_attribute->body_type = $request->body_type;
        $physical_attribute->body_art = $request->body_art;
        $physical_attribute->disability = $request->disability;
        $physical_attribute->save();
        return $this->success_message('Physical Attribute Info has been updated successfully');
    }
    public function member_language()
    {
        $member_known_languages = null;
        $member_mother_tongue = null;
        $known_languages = json_decode(auth()->user()->member->known_languages);
        $mother_tongue = auth()->user()->member->mothere_tongue;
        if ($known_languages != null) {
            $member_known_languages = LanguageResource::collection(MemberLanguage::whereIn('id', $known_languages)->get());
        }
        if ($mother_tongue != null) {
            $member_mother_tongue = new LanguageResource(MemberLanguage::where('id', $mother_tongue)->first());
        }
        $data['mother_tongue'] = $member_mother_tongue;
        $data['known_languages'] = $member_known_languages;
        return $this->response_data($data);
    }

    public function member_language_update(Request $request)
    {
        $member = Member::where('user_id', auth()->id())->first();
        if ($member) {
            $member->mothere_tongue = $request->mothere_tongue;
            $member->known_languages = $request->known_languages;
            $member->save();
            return $this->success_message('Member language info has been updated successfully');
        }

        return $this->failure_message('You are not authorized');
    }
    public function hobbies_interest()
    {
        if (auth()->user()->hobbies) {
            return (new HobbiesInterests(auth()->user()->hobbies))->additional([
                'result' => true
            ]);
        } else {
            return $this->failure_message('No information has been added for this section yet.');
        }
    }
    public function hobbies_interest_update(Request $request)
    {
        $hobbies = Hobby::where('user_id', auth()->id())->first();
        if (empty($hobbies)) {
            $hobbies = new Hobby;
            $hobbies->user_id = auth()->id();
        }
        $hobbies->hobbies = $request->hobbies;
        $hobbies->interests = $request->interests;
        $hobbies->music = $request->music;
        $hobbies->books = $request->books;
        $hobbies->movies = $request->movies;
        $hobbies->tv_shows = $request->tv_shows;
        $hobbies->sports = $request->sports;
        $hobbies->fitness_activities = $request->fitness_activities;
        $hobbies->cuisines = $request->cuisines;
        $hobbies->dress_styles = $request->dress_styles;
        $hobbies->save();
        return $this->success_message('Hobby and Interests info has been updated successfully');
    }
    public function attitude_behavior()
    {
        if (auth()->user()->attitude) {
            return (new AttitudesBehaviors(auth()->user()->attitude))->additional([
                'result' => true
            ]);
        } else {
            return $this->failure_message('No information has been added for this section yet.');
        }
    }
    public function attitude_behavior_update(Request $request)
    {
        $attitude = Attitude::where('user_id', auth()->id())->first();
        if (empty($attitude)) {
            $attitude = new Attitude;
            $attitude->user_id = auth()->id();
        }
        $attitude->affection = $request->affection;
        $attitude->humor = $request->humor;
        $attitude->political_views = $request->political_views;
        $attitude->religious_service = $request->religious_service;
        $attitude->save();
        return $this->success_message('Personal Attitude and Behavior Info has been updated successfully');
    }
    public function residency_info()
    {
        if (auth()->user()->recidency) {
            return (new ResidenceInformation(auth()->user()->recidency))->additional([
                'result' => true
            ]);
        } else {
            return $this->failure_message('No information has been added for this section yet.');
        }
    }
    public function residency_info_update(Request $request)
    {
        $recidencies = Recidency::where('user_id', auth()->id())->first();
        if (empty($recidencies)) {
            $recidencies = new Recidency;
            $recidencies->user_id = auth()->id();
        }
        $recidencies->birth_country_id = $request->birth_country_id;
        $recidencies->recidency_country_id = $request->recidency_country_id;
        $recidencies->growup_country_id = $request->growup_country_id;
        $recidencies->immigration_status = $request->immigration_status;
        $recidencies->save();
        return $this->success_message('Residency Info has been updated successfully');
    }
    public function spiritual_background()
    {
        if (auth()->user()->spiritual_backgrounds) {
            return (new SpiritualSocialBackground(auth()->user()->spiritual_backgrounds))->additional([
                'result' => true
            ]);
        } else {
            return $this->failure_message('No information has been added for this section yet.');
        }
    }

    public function spiritual_background_update(Request $request)
    {
        $spiritual_backgrounds = SpiritualBackground::where('user_id', auth()->id())->first();
        if (empty($spiritual_backgrounds)) {
            $spiritual_backgrounds = new SpiritualBackground;
            $spiritual_backgrounds->user_id = auth()->id();
        }
        $spiritual_backgrounds->religion_id = $request->member_religion_id;
        $spiritual_backgrounds->caste_id = $request->member_caste_id;
        $spiritual_backgrounds->sub_caste_id = $request->member_sub_caste_id;
        $spiritual_backgrounds->ethnicity = $request->ethnicity;
        $spiritual_backgrounds->personal_value = $request->personal_value;
        $spiritual_backgrounds->family_value_id = $request->family_value_id;
        $spiritual_backgrounds->community_value = $request->community_value;
        $spiritual_backgrounds->save();
        return $this->success_message('Spiritual Background info has been updated successfully');
    }
    public function life_style()
    {
        if (auth()->user()->lifestyles) {
            return (new LifeStyleResource(auth()->user()->lifestyles))->additional([
                'result' => true
            ]);
        } else {
            return $this->failure_message('No information has been added for this section yet.');
        }
    }
    public function life_style_update(Request $request)
    {
        $lifestyle = Lifestyle::where('user_id', auth()->id())->first();
        if (empty($lifestyle)) {
            $lifestyle = new Lifestyle;
            $lifestyle->user_id = auth()->id();
        }
        $lifestyle->diet = $request->diet;
        $lifestyle->drink = $request->drink;
        $lifestyle->smoke = $request->smoke;
        $lifestyle->living_with = $request->living_with;
        $lifestyle->save();
        return $this->success_message('Lifestyle info has been updated successfully');
    }
    public function astronomic_info()
    {
        if (auth()->user()->astrologies) {
            return (new AstronomicInformation(auth()->user()->astrologies))->additional([
                'result' => true
            ]);
        } else {
            // return $this->failure_message('No information has been added for this section yet.');
            return $this->failure_data(auth()->user()->astrologies);
        }
    }

    public function astronomic_info_update(AstrologyRequest $request)
    {
        $astrologies = Astrology::where('user_id', auth()->id())->first();
        if (empty($astrologies)) {
            $astrologies = new Astrology;
            $astrologies->user_id = auth()->id();
        }
        $astrologies->sun_sign = $request->sun_sign;
        $astrologies->moon_sign = $request->moon_sign;
        $astrologies->time_of_birth = $request->time_of_birth;
        $astrologies->city_of_birth = $request->city_of_birth;

        $astrologies->save();
        return $this->success_message('Astronomic Info has been updated successfully');
    }

    public function family_info()
    {
        if (auth()->user()->families) {
            return (new FamilyInformation(auth()->user()->families))->additional([
                'result' => true
            ]);
        } else {
            return $this->failure_message('No information has been added for this section yet.');
        }
    }

    public function family_info_update(Request $request)
    {
        $family = Family::where('user_id', auth()->id())->first();
        if (empty($family)) {
            $family = new Family;
            $family->user_id = auth()->id();
        }
        $family->father = $request->father;
        $family->mother = $request->mother;
        $family->sibling = $request->sibling;
        $family->save();
        return $this->success_message('Family Info has been updated successfully');
    }

    public function partner_expectation()
    {
        if (auth()->user()->partner_expectations) {
            return (new PartnerExpectationResource(auth()->user()->partner_expectations))->additional([
                'result' => true
            ]);
        } else {
            return $this->failure_message('No information has been added for this section yet.');
        }
    }

    public function partner_expectation_update(PartnerExpectationRequest $request)
    {
        $user = User::where('id', auth()->id())->first();
        $partner_expectations = PartnerExpectation::where('user_id', auth()->id())->first();
        if (empty($partner_expectations)) {
            $partner_expectations = new PartnerExpectation;
            $partner_expectations->user_id = auth()->id();
        }
        $partner_expectations->general = $request->general;
        $partner_expectations->height = $request->partner_height;
        $partner_expectations->weight = $request->partner_weight;
        $partner_expectations->marital_status_id = $request->partner_marital_status;
        $partner_expectations->children_acceptable = $request->partner_children_acceptable;
        $partner_expectations->residence_country_id = $request->residence_country_id;
        $partner_expectations->religion_id = $request->partner_religion_id;
        $partner_expectations->caste_id = $request->partner_caste_id;
        $partner_expectations->sub_caste_id = $request->partner_sub_caste_id;
        $partner_expectations->education = $request->pertner_education;
        $partner_expectations->profession = $request->partner_profession;
        $partner_expectations->smoking_acceptable = $request->smoking_acceptable;
        $partner_expectations->drinking_acceptable = $request->drinking_acceptable;
        $partner_expectations->diet = $request->partner_diet;
        $partner_expectations->body_type = $request->partner_body_type;
        $partner_expectations->personal_value = $request->partner_personal_value;
        $partner_expectations->manglik = $request->partner_manglik;
        $partner_expectations->language_id = $request->language_id;
        $partner_expectations->family_value_id = $request->family_value_id;
        $partner_expectations->preferred_country_id = $request->partner_country_id;
        $partner_expectations->preferred_state_id = $request->partner_state_id;
        $partner_expectations->complexion = $request->pertner_complexion;

        $partner_expectations->save();

        if ($user->member->auto_profile_match == 1) {
            $ProfileMatchController = new ProfileMatchController;
            $ProfileMatchController->match_profiles($user->id);
        }

        return $this->success_message('Partner Expectations Info has been updated successfully');
    }
    /**
     * Verify current password
     * insert new password
     */
    public function password_update(Request $request)
    {

        $this->validate($request, [
            'old_password' => ['required'],
            'password' => ['required', 'string', 'min:8', 'confirmed']
        ]);

        $user = User::findOrFail(auth()->id());

        if (Hash::check($request->old_password, $user->password)) {
            $user->password = Hash::make($request->password);
            $user->must_change_password = 0;
            $user->save();
            $currentTokenId = auth()->user()?->currentAccessToken()?->id;
            if ($currentTokenId) {
                $user->tokens()->where('id', '!=', $currentTokenId)->delete();
            } else {
                $user->tokens()->delete();
            }
            return $this->success_message('Passwoed Updated successfully.');
        }

        return $this->failure_message('Old password do not matched.');
    }

    public function account_deactivation(Request $request)
    {
        $user = auth()->user();
        $user->deactivated = $request->deacticvation_status;
        $user->save();
        $msg = $request->deacticvation_status == 1 ? 'deactivated' : 'reactivated';
        return $this->success_message(translate('Your account ' . $msg . ' successfully!'));
    }

    public function public_profile($id)
    {
        $user = User::where('id', $id)->first();
        $auth_user = auth()->user();
        if ($user) {
            $member_known_languages = null;
            $member_mother_tongue = null;
            $known_languages = json_decode($user->member->known_languages);
            $mother_tongue = json_decode($user->member->mothere_tongue);
            if ($known_languages != null) {
                $member_known_languages = LanguageResource::collection(MemberLanguage::whereIn('id', $known_languages)->get());
            }
            if ($mother_tongue != null) {
                $member_mother_tongue = new LanguageResource(MemberLanguage::where('id', $mother_tongue)->first());
            }
            $data['intoduction'] = new AboutUser($user);
            $data['basic_info'] = new BasicInformation($user);

            $profile_pic_privacy = get_setting('profile_picture_privacy');
            $photo_view_request = ViewProfilePicture::where('user_id', $user->id)->where('requested_by', $auth_user->id)->first();
            $data['profile_pic_request'] = $user->photo != null && $user->photo_approved == 1 && $profile_pic_privacy == 'only_me' && ($photo_view_request == null || ($photo_view_request && $photo_view_request->status == 0));

            $data['present_address'] = Address::where('user_id', $id)->where('type', 'present')->first() ? new AddressResource(Address::where('user_id', $id)->where('type', 'present')->first()) : null;
            $data['contact_details']['email'] = $user->email;
            $data['contact_details']['phone'] = $user->phone;
            $data['education'] = $user->education ? EducationResource::collection($user->education) : null;
            $data['career'] = $user->career ? CareerResource::collection($user->career) : null;
            $data['physical_attributes'] = $user->physical_attributes ? new PhysicalAttributes($user->physical_attributes) : null;
            $data['known_languages'] = $member_known_languages;
            $data['mother_tongue'] = $member_mother_tongue;
            $data['hobbies_interest'] = $user->hobbies ? new HobbiesInterests($user->hobbies) : null;
            $data['attitude_behavior'] = $user->attitude ? new AttitudesBehaviors($user->attitude) : null;
            $data['residence_info'] = $user->recidency ? new ResidenceInformation($user->recidency) : null;
            $data['spiritual_backgrounds'] = $user->spiritual_backgrounds ? new SpiritualSocialBackground($user->spiritual_backgrounds) : null;
            $data['lifestyles'] = $user->lifestyles ? new LifeStyleResource($user->lifestyles) : null;
            $data['astrologies'] = $user->astrologies ? new AstronomicInformation($user->astrologies) : null;
            $data['permanent_address'] = Address::where('user_id', $id)->where('type', 'permanent')->first() ? new AddressResource(Address::where('user_id', $id)->where('type', 'permanent')->first()) : null;
            $data['families_information'] = $user->families ? new FamilyInformation($user->families) : null;
            $data['partner_expectation'] = $user->partner_expectations ? new PartnerExpectationResource($user->partner_expectations) : null;

            // Voice Introduction
            $data['voice_intro_url'] = $user->member?->voice_intro_path ? Storage::disk('public')->url($user->member->voice_intro_path) : null;

            // Split gallery images: public vs private/vault
            $allGalleryImages = GalleryImage::where('user_id', $user->id)->get();
            $publicGalleryImages = $allGalleryImages->filter(fn($img) => !in_array($img->privacy_level, ['private', 'vault']));
            $privateGalleryImages = $allGalleryImages->filter(fn($img) => in_array($img->privacy_level, ['private', 'vault']));

            $gallery_image_privacy = get_setting('gallery_image_privacy');
            $gallery_image_request = ViewGalleryImage::where('user_id', $user->id)->where('requested_by', $auth_user->id)->first();

            $publicPhotos = collect();
            $privatePhotos = collect();

            // Determine access for public gallery images
            if ($gallery_image_privacy == 'only_me') {
                if ($gallery_image_request !== null && $gallery_image_request->status == 1) {
                    $publicPhotos = GalleryImageResource::collection($publicGalleryImages);
                } else {
                    $publicPhotos = RequestedGalleryImage::collection($publicGalleryImages);
                }
            } elseif ($gallery_image_privacy == "all") {
                $publicPhotos = GalleryImageResource::collection($publicGalleryImages);
            } else {
                if ($auth_user->membership == 2) {
                    $publicPhotos = GalleryImageResource::collection($publicGalleryImages);
                } else {
                    $publicPhotos = RequestedGalleryImage::collection($publicGalleryImages);
                }
            }

            // Private/vault images — return metadata only (URL replaced with null, marked as blurred)
            $blurredPrivatePhotos = $privateGalleryImages->map(function ($img) {
                return [
                    'id' => $img->id,
                    'image' => null,
                    'image_path' => null,
                    'url' => null,
                    'is_private' => true,
                    'is_blurred' => true,
                    'privacy_level' => 'private',
                    'thumbnail' => uploaded_asset($img->image), // low-quality for blur rendering
                ];
            })->values();

            // Merge public + blurred private
            $data['photo_gallery'] = collect($publicPhotos)->merge($blurredPrivatePhotos)->values();

            // Screenshot deterrence flag for viewer
            $ownerVisibility = FieldVisibilitySetting::getForUser($user->id);
            $data['screenshot_deterrence'] = $ownerVisibility['screenshot_deterrence'] ?? true;

            $data['profile_match'] = null;
            $profile_match = ProfileMatch::where('user_id', $auth_user->id)
                ->where('match_id', $user->id)
                ->first();
            if (!empty($profile_match) && $auth_user->member->auto_profile_match == 1) {
                $data['profile_match'] = $profile_match->match_percentage;
            }
            $data['view_contact_check'] = ViewContact::where('user_id', $user->id)->where('viewed_by', auth()->id())->first() ? true : false;

            // Profile view data store
            if ($user->id != $auth_user->id) {
                $profileViewed = ProfileViewer::where('user_id', $user->id)->where('viewed_by', $auth_user->id)->first();
                if ($profileViewed == null) {
                    if (package_validity($user->id) && $user->member->remaining_profile_viewer_view > 0) {
                        ProfileViewer::create([
                            'user_id' => $user->id,
                            'viewed_by' => $auth_user->id
                        ]);
                        $usermember = $user->member;
                        $usermember->remaining_profile_viewer_view = $usermember->remaining_profile_viewer_view - 1;
                        $usermember->save();

                        // Profile viewed Notification for member
                        try {
                            $notify_type = 'profile_viewed';
                            $id = unique_notify_id();
                            $notify_by = $auth_user->id;
                            $info_id = $user->id;
                            $message = $auth_user->first_name . ' ' . $auth_user->last_name . ' ' . translate(' has viewed your profile.');
                            $route = route('member_profile', $auth_user->id);

                            // fcm 
                            if (get_setting('firebase_push_notification') == 1) {
                                $fcmTokens = User::where('id', $user->id)->whereNotNull('fcm_token')->pluck('fcm_token')->toArray();
                                self::sendFirebaseNotification($fcmTokens, $user, $notify_type, $message, $notify_by);
                            }
                            // end of fcm

                            Notification::send($user, new DbStoreNotification($notify_type, $id, $notify_by, $info_id, $message, $route));
                        } catch (\Exception $e) {
                            //
                        }
                    }
                }
            }

            return $this->response_data($data);
        } else {
            return $this->failure_message("User Not Found");
        }
    }

    public static function sendFirebaseNotification($fcmTokens = null, $notify_user, $notify_type, $message, $notify_by = null)
    {
        // send firebase notification for mobile app
        if ($notify_user->fcm_token != null) {
            $data = (object) [];
            $data->fcm_token = $notify_user->fcm_token;
            $data->title = $notify_type;
            $data->text = $message;
            $data->notify_by = $notify_by;
            FirbaseNotification::send($data);
        }
        // end of  firebase notification

        Larafirebase::withTitle(str_replace("_", " ", $notify_type))
            ->withBody($message)
            ->sendMessage($fcmTokens);
    }

    public function contact_info_update(Request $request)
    {
        $user = User::where('id', auth()->id())->first();
        $user->email = $request->email;
        $user->phone = $request->phone;
        if ($user->save()) {
            return $this->success_message('Contact Info has been updated successfully');
        } else {
            return $this->failure_message('We could not update your contact information right now. Please try again.');
        }
    }

    public function store_view_contact(Request $request)
    {
        $contact_view_check = ViewContact::where('user_id', $request->id)->where('viewed_by', auth()->id())->first();
        if (!$contact_view_check) {
            $view_contact_by_user = auth()->user();
            $view_contact_by_member = $view_contact_by_user->member;

            if ($view_contact_by_member->remaining_contact_view > 0) {

                // Store view contact data
                $view_contact = new ViewContact;
                $view_contact->user_id = $request->id;
                $view_contact->viewed_by = $view_contact_by_user->id;
                if ($view_contact->save()) {

                    // Deduct View Contact by user's remaining contact views
                    $view_contact_by_member->remaining_contact_view -= 1;
                    $view_contact_by_member->save();
                    return $this->success_message('Request sent successfully!');
                } else {
                    return $this->failure_message('Request failed to be sent!');
                }
            } else {
                return $this->failure_message('You do not have enough request to send');
            }
        } else {
            return $this->failure_message('You already sent an request');
        }
    }

    public function matched_profile()
    {
        $matched_profiles = [];
        $user = auth()->user();
        if ($user->member->auto_profile_match == 1) {
            $matched_profiles = ProfileMatch::orderBy('match_percentage', 'desc')
                ->where('user_id', $user->id)
                ->where('match_percentage', '>=', 50);
            $ignored_to = IgnoredUser::where('ignored_by', $user->id)->pluck('user_id')->toArray();
            if (count($ignored_to) > 0) {
                $matched_profiles = $matched_profiles->whereNotIn('match_id', $ignored_to);
            }
            $ignored_by_ids = IgnoredUser::where('user_id', $user->id)->pluck('ignored_by')->toArray();
            if (count($ignored_by_ids) > 0) {
                $matched_profiles = $matched_profiles->whereNotIn('match_id', $ignored_by_ids);
            }
            $matched_profiles = $matched_profiles->limit(20)->get();
        }
        return MatchedProfileResource::collection($matched_profiles);
    }

    public function account_delete(Request $request)
    {
        $user = auth()->user();
        if ($user) {
            $user->member ? $user->member->delete() : '';
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
            Shortlist::where('user_id', $user->id)->delete();
            IgnoredUser::where('user_id', $user->id)->delete();
            ReportedUser::where('user_id', $user->id)->delete();
            GalleryImage::where('user_id', $user->id)->delete();
            ExpressInterest::where('user_id', $user->id)->delete();
            ProfileMatch::where('user_id', $user->id)->delete();
            ChatThread::where('sender_user_id', auth()->user()->id)->orWhere('receiver_user_id', auth()->user()->id)->delete();
            User::destroy(auth()->user()->id);
            $user->tokens()
                ->where('id', $user->currentAccessToken()->id)
                ->delete();
            return $this->success_message('Your account has deleted successfully!');
        }
        return $this->failure_message('Something Went Wrong!');
    }

    public function get_full_profile_react()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'result' => false,
                'message' => 'Your session has expired. Please sign in again.',
            ], 401);
        }

        $member = $user->member;
        $optionSets = $this->getMarriageIntentOptionSets();

        $physical_attributes = PhysicalAttribute::where('user_id', $user->id)->first();
        $lifestyle = Lifestyle::where('user_id', $user->id)->first();
        $astrology = Astrology::where('user_id', $user->id)->first();
        $partner_expectation = PartnerExpectation::where('user_id', $user->id)->first();
        $spiritual = SpiritualBackground::where('user_id', $user->id)->first();
        $family = DB::table('families')->where('user_id', $user->id)->first();
        $recidency = Recidency::where('user_id', $user->id)->first();
        $presentAddress = Address::where('user_id', $user->id)->where('type', 'present')->first();
        $hobbies = Hobby::where('user_id', $user->id)->first();
        $career = DB::table('careers')->where('user_id', $user->id)->whereNull('deleted_at')->orderBy('end', 'desc')->first();
        $education = DB::table('education')->where('user_id', $user->id)->whereNull('deleted_at')->orderBy('end', 'desc')->first();
        $allCareers = DB::table('careers')->where('user_id', $user->id)->whereNull('deleted_at')->orderByDesc('present')->orderByDesc('end')->get();
        $allEducations = DB::table('education')->where('user_id', $user->id)->whereNull('deleted_at')->orderByDesc('is_highest_degree')->orderByDesc('end')->get();
        $currentResidencyCountry = $presentAddress && $presentAddress->country_id ? Country::find($presentAddress->country_id) : null;
        $currentResidencyState = $presentAddress && $presentAddress->state_id ? State::find($presentAddress->state_id) : null;
        $currentResidencyCity = $presentAddress && $presentAddress->city_id ? City::find($presentAddress->city_id) : null;
        $hobbyList = [];
        if (!empty($hobbies?->hobbies)) {
            $hobbyList = array_values(array_filter(array_map('trim', explode(',', $hobbies->hobbies))));
        }
        $interestList = [];
        if (!empty($hobbies?->interests)) {
            $interestList = array_values(array_filter(array_map('trim', explode(',', $hobbies->interests))));
        }
        $personalityTags = [];
        if (!empty($lifestyle?->personality_tags)) {
            $decodedTags = json_decode($lifestyle->personality_tags, true);
            if (is_array($decodedTags)) {
                $personalityTags = array_values(array_filter(array_map('trim', $decodedTags)));
            }
        }
        $knownLanguageNames = [];
        if (!empty($member->known_languages)) {
            $decodedLanguages = json_decode($member->known_languages, true);
            if (is_array($decodedLanguages) && count($decodedLanguages)) {
                $knownLanguageNames = MemberLanguage::whereIn('id', $decodedLanguages)->pluck('name')->toArray();
            }
        }
        $knownLanguageNamesText = $knownLanguageNames ? implode(', ', $knownLanguageNames) : '';
        $physicalHeightCm = null;
        if ($physical_attributes && $physical_attributes->height !== null && $physical_attributes->height !== '') {
            $heightValue = (float) $physical_attributes->height;
            $physicalHeightCm = $heightValue > 20 ? $heightValue : round($heightValue * 30.48);
        }
        $expectationHeightCm = null;
        if ($partner_expectation && $partner_expectation->height !== null && $partner_expectation->height !== '') {
            $heightValue = (float) $partner_expectation->height;
            $expectationHeightCm = $heightValue > 20 ? $heightValue : round($heightValue * 30.48);
        }
        $expectationMaritalStatus = $partner_expectation && $partner_expectation->marital_status ? $partner_expectation->marital_status->name : '';
        $expectationReligion = $partner_expectation && $partner_expectation->religion ? $partner_expectation->religion->name : '';
        $expectationLanguage = $partner_expectation && $partner_expectation->member_language ? $partner_expectation->member_language->name : '';
        $expectationResidence = '';
        if ($partner_expectation && $partner_expectation->residence_country_id) {
            $residenceCountry = Country::where('id', $partner_expectation->residence_country_id)->first();
            $expectationResidence = $residenceCountry?->name ?? '';
        }
        $formatSalary = function ($value) {
            if ($value === null) {
                return '';
            }
            $numericValue = (float) $value;
            if ($numericValue >= 1000000) {
                $millions = $numericValue / 1000000;
                $formatted = rtrim(rtrim(number_format($millions, 1, '.', ''), '0'), '.');
                return $formatted . 'M';
            }
            return number_format($numericValue);
        };
        $incomeLabel = '';
        if (!empty($member->annual_salary_range_id)) {
            $salaryRange = AnnualSalaryRange::find($member->annual_salary_range_id);
            if ($salaryRange) {
                $minSalary = $salaryRange->min_salary;
                $maxSalary = $salaryRange->max_salary;
                if ($minSalary !== null && $maxSalary !== null) {
                    $incomeLabel = 'Rs. ' . $formatSalary($minSalary) . ' - ' . $formatSalary($maxSalary);
                } elseif ($minSalary !== null) {
                    $incomeLabel = 'Rs. ' . $formatSalary($minSalary) . '+';
                }
            }
        }
        $salaryRanges = AnnualSalaryRange::orderBy('min_salary')->get()->map(function ($range) use ($formatSalary) {
            $label = 'Rs. ' . $formatSalary($range->min_salary) . ' - ' . $formatSalary($range->max_salary);
            return [
                'id' => $range->id,
                'min' => $range->min_salary,
                'max' => $range->max_salary,
                'label' => $label,
            ];
        });

        $visibility = \App\Models\FieldVisibilitySetting::getForUser($user->id);

        // Server truth for gate:
        // onboarding must be explicitly completed and required onboarding data must be present.
        $isOnboardingDataComplete = $this->isOnboardingDataComplete($user, $member);
        $onboardingCompleted = (bool) $member->onboarding_completed && $isOnboardingDataComplete;

        // Keep persisted state aligned for old/inconsistent accounts.
        if ((bool) $member->onboarding_completed !== $onboardingCompleted) {
            $member->onboarding_completed = $onboardingCompleted ? 1 : 0;
            $member->save();
        }

        return response()->json([
            'result' => true,
            'basics' => [
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'name' => $user->name,
                'gender' => ($member->gender === null || $member->gender === '') ? '' : (($member->gender == 2) ? 'Female' : 'Male'),
                'dateOfBirth' => $member->birthday ?? '',
                'maritalStatusId' => $member->marital_status_id ?? '',
                'onBehalfId' => $member->on_behalves_id ?? '',
                'phone' => $user->phone ?? '',
                'email' => $user->email ?? '',
                'nationality' => $member->nationality ?? '',
                'languages' => $knownLanguageNames,
                'language' => $knownLanguageNamesText,
                'immigrationStatus' => $recidency?->immigration_status ?? '',
                'currentResidencyCountryId' => $presentAddress?->country_id,
                'currentResidencyStateId' => $presentAddress?->state_id,
                'currentResidencyCityId' => $presentAddress?->city_id,
                'currentResidencyCountry' => $currentResidencyCountry?->name ?? '',
                'currentResidencyState' => $currentResidencyState?->name ?? '',
                'currentResidencyCity' => $currentResidencyCity?->name ?? '',
                'marriageTimeline' => $member->marriage_timeline ?? '',
                'relocationWillingness' => $member->relocation_willingness ?? '',
                'seriousnessLevel' => $member->seriousness_level ?? '',
                'avatarUrl' => $user->photo ? ((strpos($user->photo, 'http') === 0) ? $user->photo : uploaded_asset($user->photo)) : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
                'hasProfilePhoto' => !empty($user->photo),
                'height' => $physicalHeightCm ?? '',
                'weight' => $physical_attributes->weight ?? '',
                'complexion' => $physical_attributes->complexion ?? '',
                'introduction' => $member->introduction ?? '',
                'onboardingCompleted' => $onboardingCompleted,
            ],
            'lifestyle' => [
                'diet' => $lifestyle->diet ?? '',
                'drink' => $lifestyle->drink ?? '',
                'smoke' => $lifestyle->smoke ?? '',
                'property' => $lifestyle->property ?? '',
                'propertyDetails' => $lifestyle->property_details ?? '',
                'livingWith' => $lifestyle->living_with ?? '',
                'sleepSchedule' => $lifestyle->sleep_schedule ?? '',
                'hobbies' => $hobbyList,
                'interests' => $interestList,
                'personalityTags' => $personalityTags,
                'personalValue' => $spiritual?->personal_value ?? '',
                'communityValue' => $spiritual?->community_value ?? '',
                'familyValueId' => $spiritual?->family_value_id,
            ],
            'career' => [
                'designation' => $career->designation ?? $member->designation ?? $member->specialization ?? '',
                'company' => $career->company ?? $member->company ?? '',
                'education' => $education->degree ?? $member->education ?? '',
                'institution' => $education->institution ?? '',
                'educationStart' => $education->start ?? '',
                'educationEnd' => $education->end ?? '',
                'isHighestDegree' => (bool) ($education->is_highest_degree ?? false),
                'income' => $incomeLabel,
                'incomeRangeId' => $member->annual_salary_range_id ?? null,
                'workLocationType' => $career->work_location_type ?? '',
                'careerStart' => $career->start ?? '',
                'careerEnd' => $career->end ?? '',
                'careerPresent' => (bool) ($career->present ?? false),
                'educations' => $allEducations->map(function ($edu) {
                    return [
                        'id' => $edu->id,
                        'degree' => $edu->degree ?? '',
                        'institution' => $edu->institution ?? '',
                        'start' => $edu->start ?? '',
                        'end' => $edu->end ?? '',
                        'isHighestDegree' => (bool) ($edu->is_highest_degree ?? false),
                    ];
                })->values()->toArray(),
                'careers' => $allCareers->map(function ($c) {
                    return [
                        'id' => $c->id,
                        'designation' => $c->designation ?? '',
                        'company' => $c->company ?? '',
                        'start' => $c->start ?? '',
                        'end' => $c->end ?? '',
                        'present' => (bool) ($c->present ?? false),
                        'workLocationType' => $c->work_location_type ?? '',
                    ];
                })->values()->toArray(),
            ],
            'optionSets' => $optionSets,
            'family' => [
                'fatherOccupation' => $family->father_occupation ?? '',
                'motherOccupation' => $family->mother_occupation ?? '',
                'familyLocation' => trim(implode(', ', array_filter([
                    $family->location_city ?? '',
                    $family->location_country ?? ''
                ]))),
                'familyType' => $family->family_type ?? '',
                'brothers' => $family->no_of_brothers ?? 0,
                'sisters' => $family->no_of_sisters ?? 0,
                'religionId' => $spiritual?->religion_id,
                'religion' => $spiritual && $spiritual->religion ? $spiritual->religion->name : '',
                'sect' => $spiritual->ethnicity ?? '',
                'sectId' => $spiritual?->sect_id,
                'sectName' => $spiritual && $spiritual->sect ? $spiritual->sect->name : '',
                'casteId' => $spiritual?->caste_id,
                'caste' => $spiritual && $spiritual->caste ? $spiritual->caste->name : '',
            ],
            'expectations' => [
                'general' => $partner_expectation->general ?? '',
                'residence' => $expectationResidence,
                'residenceCountryId' => $partner_expectation?->residence_country_id,
                'min_age' => $partner_expectation->min_age ?? 20,
                'max_age' => $partner_expectation->max_age ?? 40,
                'min_height' => $expectationHeightCm ?? '',
                'maritalStatusId' => $partner_expectation?->marital_status_id,
                'marital_status' => $expectationMaritalStatus,
                'religionId' => $partner_expectation?->religion_id,
                'religion' => $expectationReligion,
                'languageId' => $partner_expectation?->language_id,
                'language' => $expectationLanguage,
                'familyValueId' => $partner_expectation?->family_value_id,
                'age_importance' => $partner_expectation->age_importance ?? 'Dealbreaker',
                'height_importance' => $partner_expectation->height_importance ?? 'Nice to have',
                'marital_status_importance' => $partner_expectation->marital_status_importance ?? 'Dealbreaker',
                'religion_importance' => $partner_expectation->religion_importance ?? 'Must have',
                'language_importance' => $partner_expectation->language_importance ?? 'Nice to have',
                'residence_importance' => $partner_expectation->residence_importance ?? 'Nice to have',
            ],
            'media' => [
                'gallery' => GalleryImage::where('user_id', $user->id)->get()->map(function ($img) {
                    return [
                        'id' => $img->id,
                        'url' => uploaded_asset($img->image),
                        'privacy_level' => $img->privacy_level ?? 'public',
                        'is_main' => $img->is_main_photo ?? false,
                    ];
                }),
                'voice_intro_url' => $member->voice_intro_path ? Storage::disk('public')->url($member->voice_intro_path) : null,
                'intro_video_url' => $member->intro_video_path ? uploaded_asset($member->intro_video_path) : null,
            ],
            'salaryRanges' => $salaryRanges,
            'visibility' => $visibility
        ]);
    }

    public function update_full_profile_react(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'result' => false,
                'message' => 'Your session has expired. Please sign in again.',
            ], 401);
        }

        $member = $user->member;
        if (!$member) {
            return response()->json(['result' => false, 'message' => 'Member profile not found'], 404);
        }

        $normalizeStringList = function ($value) {
            if (is_array($value)) {
                $items = array_map(function ($item) {
                    return trim((string) $item);
                }, $value);
                return array_values(array_filter($items, 'strlen'));
            }
            if (is_string($value)) {
                $items = array_map('trim', explode(',', $value));
                return array_values(array_filter($items, 'strlen'));
            }
            return [];
        };

        $normalizeFloat = function ($value) {
            if ($value === null || $value === '') {
                return null;
            }
            if (is_numeric($value)) {
                return (float) $value;
            }
            $clean = preg_replace('/[^0-9\\.]/', '', (string) $value);
            return ($clean !== '' && is_numeric($clean)) ? (float) $clean : null;
        };

        $normalizeInt = function ($value) {
            if ($value === null || $value === '') {
                return null;
            }
            if (is_numeric($value)) {
                return (int) $value;
            }
            $clean = preg_replace('/[^0-9]/', '', (string) $value);
            return $clean !== '' ? (int) $clean : null;
        };

        $normalizeSiblingCount = function ($value) use ($normalizeInt) {
            if ($value === null || $value === '') {
                return 0;
            }
            if (is_string($value) && strpos($value, '+') !== false) {
                $value = str_replace('+', '', $value);
            }
            $count = $normalizeInt($value);
            return $count ?? 0;
        };

        $parseHeightToFeet = function ($value) use ($normalizeFloat) {
            if ($value === null || $value === '') {
                return null;
            }
            if (is_numeric($value)) {
                $height = (float) $value;
                return $height > 20 ? round($height / 30.48, 2) : round($height, 2);
            }
            $text = trim((string) $value);
            if ($text === '') {
                return null;
            }
            if (strpos($text, "'") !== false || stripos($text, 'ft') !== false) {
                if (preg_match("/(\\d+)\\s*(?:ft|')\\s*(\\d+)?/i", $text, $matches)) {
                    $feet = (int) $matches[1];
                    $inches = isset($matches[2]) ? (int) $matches[2] : 0;
                    return round($feet + ($inches / 12), 2);
                }
            }
            if (preg_match('/^(\\d+(?:\\.\\d+)?)\\s*cm$/i', $text, $matches)) {
                $cm = (float) $matches[1];
                return round($cm / 30.48, 2);
            }
            $numeric = preg_replace('/[^0-9\\.]/', '', $text);
            if ($numeric !== '' && is_numeric($numeric)) {
                $height = (float) $numeric;
                return $height > 20 ? round($height / 30.48, 2) : round($height, 2);
            }
            return null;
        };

        if ($request->has('basics')) {
            $basics = $request->input('basics', []);
            $optionSets = $this->getMarriageIntentOptionSets();
            $timelineValues = array_column($optionSets['marriageTimeline'], 'value');
            $relocationValues = array_column($optionSets['relocationWillingness'], 'value');
            $seriousnessValues = array_column($optionSets['seriousnessLevel'], 'value');

            if (array_key_exists('firstName', $basics)) {
                $user->first_name = $basics['firstName'];
            }
            if (array_key_exists('lastName', $basics)) {
                $user->last_name = $basics['lastName'];
            }
            if (array_key_exists('phone', $basics)) {
                $user->phone = $basics['phone'];
            }
            if (array_key_exists('email', $basics)) {
                $user->email = $basics['email'];
            }

            if (array_key_exists('gender', $basics)) {
                $member->gender = ($basics['gender'] == 'Female') ? 2 : 1;
            }
            if (array_key_exists('dateOfBirth', $basics)) {
                $member->birthday = $basics['dateOfBirth'] ?: null;
            }
            if (array_key_exists('maritalStatusId', $basics)) {
                $member->marital_status_id = $basics['maritalStatusId'] ?: null;
            }
            if (array_key_exists('onBehalfId', $basics)) {
                $member->on_behalves_id = $basics['onBehalfId'] ?: null;
            }
            if (array_key_exists('nationality', $basics)) {
                $member->nationality = $basics['nationality'];
            }
            if (array_key_exists('introduction', $basics)) {
                $member->introduction = $basics['introduction'];
            }
            if (array_key_exists('immigrationStatus', $basics)) {
                Recidency::updateOrCreate(
                    ['user_id' => $user->id],
                    ['immigration_status' => $basics['immigrationStatus'] ?: null]
                );
            }
            $currentCountryId = $normalizeInt($basics['currentResidencyCountryId'] ?? null);
            $currentStateId = $normalizeInt($basics['currentResidencyStateId'] ?? null);
            $currentCityId = $normalizeInt($basics['currentResidencyCityId'] ?? null);
            if ($currentCountryId || $currentStateId || $currentCityId) {
                Address::updateOrCreate(
                    ['user_id' => $user->id, 'type' => 'present'],
                    [
                        'country_id' => $currentCountryId,
                        'state_id' => $currentStateId,
                        'city_id' => $currentCityId,
                    ]
                );
            }
            if (array_key_exists('marriageTimeline', $basics)) {
                $timelineValue = $basics['marriageTimeline'] ?: null;
                if (in_array($timelineValue, $timelineValues, true)) {
                    $member->marriage_timeline = $timelineValue;
                } elseif ($timelineValue === null) {
                    $member->marriage_timeline = null;
                }
            }
            if (array_key_exists('relocationWillingness', $basics)) {
                $relocationValue = $basics['relocationWillingness'] ?: null;
                if (in_array($relocationValue, $relocationValues, true)) {
                    $member->relocation_willingness = $relocationValue;
                } elseif ($relocationValue === null) {
                    $member->relocation_willingness = null;
                }
            }
            if (array_key_exists('seriousnessLevel', $basics)) {
                $seriousnessValue = $basics['seriousnessLevel'] ?: null;
                if (in_array($seriousnessValue, $seriousnessValues, true)) {
                    $member->seriousness_level = $seriousnessValue;
                } elseif ($seriousnessValue === null) {
                    // Default to 'marriage' instead of null if it's being set to empty/null
                    $member->seriousness_level = 'marriage';
                }
            }

            if (array_key_exists('languages', $basics) || array_key_exists('language', $basics)) {
                $languageNames = $normalizeStringList($basics['languages'] ?? $basics['language'] ?? null);
                $languageIds = [];
                if (!empty($languageNames)) {
                    $existingLanguages = MemberLanguage::select('id', 'name')->get();
                    $languageMap = [];
                    foreach ($existingLanguages as $language) {
                        $languageMap[strtolower($language->name)] = $language->id;
                    }
                    foreach ($languageNames as $languageName) {
                        $key = strtolower($languageName);
                        if ($key === '') {
                            continue;
                        }
                        if (!isset($languageMap[$key])) {
                            $newLanguage = new MemberLanguage();
                            $newLanguage->name = $languageName;
                            $newLanguage->save();
                            $languageMap[$key] = $newLanguage->id;
                        }
                        $languageIds[] = $languageMap[$key];
                    }
                }
                $member->known_languages = $languageIds ? json_encode(array_values(array_unique($languageIds))) : null;
            }

            $physicalUpdates = [];
            if (array_key_exists('height', $basics)) {
                $physicalUpdates['height'] = $parseHeightToFeet($basics['height']);
            }
            if (array_key_exists('weight', $basics)) {
                $physicalUpdates['weight'] = $normalizeFloat($basics['weight']);
            }
            if (array_key_exists('complexion', $basics)) {
                $physicalUpdates['complexion'] = $basics['complexion'];
            }
            if (!empty($physicalUpdates)) {
                PhysicalAttribute::updateOrCreate(
                    ['user_id' => $user->id],
                    $physicalUpdates
                );
            }
        }

        if ($request->has('lifestyle')) {
            $lifestyleData = $request->input('lifestyle', []);
            $lifestylePayload = [
                'diet' => $lifestyleData['diet'] ?? null,
                'drink' => $lifestyleData['drink'] ?? null,
                'smoke' => $lifestyleData['smoke'] ?? null,
                'property' => $lifestyleData['property'] ?? null,
                'property_details' => $lifestyleData['propertyDetails'] ?? null,
                'living_with' => $lifestyleData['livingWith'] ?? null,
                'sleep_schedule' => $lifestyleData['sleepSchedule'] ?? null,
            ];
            if (array_key_exists('personalityTags', $lifestyleData)) {
                $tags = $normalizeStringList($lifestyleData['personalityTags']);
                $lifestylePayload['personality_tags'] = $tags ? json_encode($tags) : null;
            }
            Lifestyle::updateOrCreate(
                ['user_id' => $user->id],
                $lifestylePayload
            );

            if (array_key_exists('hobbies', $lifestyleData) || array_key_exists('interests', $lifestyleData)) {
                $hobbyItems = $normalizeStringList($lifestyleData['hobbies'] ?? null);
                $interestItems = $normalizeStringList($lifestyleData['interests'] ?? null);
                Hobby::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'hobbies' => $hobbyItems ? implode(', ', $hobbyItems) : null,
                        'interests' => $interestItems ? implode(', ', $interestItems) : null,
                    ]
                );
            }

            if (
                array_key_exists('personalValue', $lifestyleData) ||
                array_key_exists('communityValue', $lifestyleData) ||
                array_key_exists('familyValueId', $lifestyleData)
            ) {
                SpiritualBackground::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'personal_value' => $lifestyleData['personalValue'] ?? null,
                        'community_value' => $lifestyleData['communityValue'] ?? null,
                        'family_value_id' => $normalizeInt($lifestyleData['familyValueId'] ?? null),
                    ]
                );
            }
        }

        if ($request->has('career')) {
            $careerData = $request->input('career', []);

            // === Handle multiple education entries ===
            if (array_key_exists('educations', $careerData) && is_array($careerData['educations'])) {
                $incomingEducationIds = [];
                foreach ($careerData['educations'] as $eduEntry) {
                    $eduPayload = [
                        'user_id' => $user->id,
                        'degree' => $eduEntry['degree'] ?? null,
                        'institution' => $eduEntry['institution'] ?? null,
                        'start' => $normalizeInt($eduEntry['start'] ?? null),
                        'end' => $normalizeInt($eduEntry['end'] ?? null),
                        'is_highest_degree' => !empty($eduEntry['isHighestDegree']) ? 1 : 0,
                        'updated_at' => now(),
                    ];
                    if (!empty($eduEntry['id'])) {
                        // Update existing
                        DB::table('education')->where('id', $eduEntry['id'])->where('user_id', $user->id)->update($eduPayload);
                        $incomingEducationIds[] = $eduEntry['id'];
                    } else {
                        // Insert new
                        $eduPayload['created_at'] = now();
                        $newId = DB::table('education')->insertGetId($eduPayload);
                        $incomingEducationIds[] = $newId;
                    }
                }
                // Soft-delete entries that were removed by the user
                if (!empty($incomingEducationIds)) {
                    DB::table('education')
                        ->where('user_id', $user->id)
                        ->whereNull('deleted_at')
                        ->whereNotIn('id', $incomingEducationIds)
                        ->update(['deleted_at' => now()]);
                }
            } else {
                // Legacy single-entry fallback
                $existingEducation = DB::table('education')
                    ->where('user_id', $user->id)
                    ->whereNull('deleted_at')
                    ->orderByDesc('is_highest_degree')
                    ->orderByDesc('updated_at')
                    ->first();

                $educationPayload = [
                    'user_id' => $user->id,
                    'degree' => $careerData['education'] ?? null,
                    'institution' => $careerData['institution'] ?? null,
                    'start' => $normalizeInt($careerData['educationStart'] ?? null),
                    'end' => $normalizeInt($careerData['educationEnd'] ?? null),
                    'is_highest_degree' => !empty($careerData['isHighestDegree']) ? 1 : 0,
                    'updated_at' => now(),
                ];

                if ($existingEducation) {
                    DB::table('education')->where('id', $existingEducation->id)->update($educationPayload);
                } else {
                    $educationPayload['created_at'] = now();
                    DB::table('education')->insert($educationPayload);
                }
            }

            // === Handle multiple career entries ===
            if (array_key_exists('careers', $careerData) && is_array($careerData['careers'])) {
                $incomingCareerIds = [];
                foreach ($careerData['careers'] as $carEntry) {
                    $carPayload = [
                        'user_id' => $user->id,
                        'designation' => $carEntry['designation'] ?? null,
                        'company' => $carEntry['company'] ?? null,
                        'work_location_type' => $carEntry['workLocationType'] ?? null,
                        'start' => $normalizeInt($carEntry['start'] ?? null),
                        'end' => $normalizeInt($carEntry['end'] ?? null),
                        'present' => !empty($carEntry['present']) ? 1 : 0,
                        'updated_at' => now(),
                    ];
                    if (!empty($carEntry['id'])) {
                        DB::table('careers')->where('id', $carEntry['id'])->where('user_id', $user->id)->update($carPayload);
                        $incomingCareerIds[] = $carEntry['id'];
                    } else {
                        $carPayload['created_at'] = now();
                        $newId = DB::table('careers')->insertGetId($carPayload);
                        $incomingCareerIds[] = $newId;
                    }
                }
                // Soft-delete entries that were removed by the user
                if (!empty($incomingCareerIds)) {
                    DB::table('careers')
                        ->where('user_id', $user->id)
                        ->whereNull('deleted_at')
                        ->whereNotIn('id', $incomingCareerIds)
                        ->update(['deleted_at' => now()]);
                }
            } else {
                // Legacy single-entry fallback
                $existingCareer = DB::table('careers')
                    ->where('user_id', $user->id)
                    ->whereNull('deleted_at')
                    ->orderByDesc('present')
                    ->orderByDesc('updated_at')
                    ->first();

                $careerPayload = [
                    'user_id' => $user->id,
                    'designation' => $careerData['designation'] ?? null,
                    'company' => $careerData['company'] ?? null,
                    'work_location_type' => $careerData['workLocationType'] ?? null,
                    'start' => $normalizeInt($careerData['careerStart'] ?? null),
                    'end' => $normalizeInt($careerData['careerEnd'] ?? null),
                    'present' => !empty($careerData['careerPresent']) ? 1 : 0,
                    'updated_at' => now(),
                ];

                if ($existingCareer) {
                    DB::table('careers')->where('id', $existingCareer->id)->update($careerPayload);
                } else {
                    $careerPayload['created_at'] = now();
                    DB::table('careers')->insert($careerPayload);
                }
            }

            // Update member specialization from the primary (first) career entry
            $primaryCareer = DB::table('careers')->where('user_id', $user->id)->whereNull('deleted_at')->orderByDesc('present')->orderByDesc('updated_at')->first();
            if ($primaryCareer) {
                $member->specialization = $primaryCareer->designation;
            }

            if (array_key_exists('incomeRangeId', $careerData)) {
                $rangeId = $normalizeInt($careerData['incomeRangeId']);
                $member->annual_salary_range_id = $rangeId ?: null;
            } elseif (array_key_exists('income', $careerData)) {
                $incomeValue = trim((string) ($careerData['income'] ?? ''));
                if ($incomeValue !== '') {
                    $ranges = AnnualSalaryRange::orderBy('min_salary', 'asc')->get();
                    if ($ranges->isNotEmpty()) {
                        $rangeId = null;
                        if (is_numeric($incomeValue)) {
                            $numericValue = (float) $incomeValue;
                            foreach ($ranges as $range) {
                                if ($numericValue >= $range->min_salary && $numericValue <= $range->max_salary) {
                                    $rangeId = $range->id;
                                    break;
                                }
                            }
                        } else {
                            if (preg_match('/([0-9\\.]+)\\s*M\\s*-\\s*([0-9\\.]+)\\s*M/i', $incomeValue, $match)) {
                                $minValue = (float) $match[1] * 1000000;
                                $maxValue = (float) $match[2] * 1000000;
                                foreach ($ranges as $range) {
                                    if ($minValue == $range->min_salary && $maxValue == $range->max_salary) {
                                        $rangeId = $range->id;
                                        break;
                                    }
                                }
                            }
                            if (preg_match('/([0-9\\.]+)\\s*M/i', $incomeValue, $match)) {
                                $numericValue = (float) $match[1] * 1000000;
                                foreach ($ranges as $range) {
                                    if ($numericValue >= $range->min_salary && $numericValue <= $range->max_salary) {
                                        $rangeId = $range->id;
                                        break;
                                    }
                                }
                            }
                        }
                        if ($rangeId) {
                            $member->annual_salary_range_id = $rangeId;
                        }
                    }
                } else {
                    $member->annual_salary_range_id = null;
                }
            }
        }

        if ($request->has('family')) {
            $familyData = $request->input('family', []);
            $locationCity = null;
            $locationCountry = null;
            if (!empty($familyData['familyLocation'])) {
                $parts = array_map('trim', explode(',', $familyData['familyLocation'], 2));
                $locationCity = $parts[0] ?? null;
                $locationCountry = $parts[1] ?? null;
            }
            DB::table('families')->updateOrInsert(
                ['user_id' => $user->id],
                [
                    'father_occupation' => $familyData['fatherOccupation'] ?? null,
                    'mother_occupation' => $familyData['motherOccupation'] ?? null,
                    'location_city' => $locationCity,
                    'location_country' => $locationCountry,
                    'family_type' => $familyData['familyType'] ?? null,
                    'no_of_brothers' => $normalizeSiblingCount($familyData['brothers'] ?? 0),
                    'no_of_sisters' => $normalizeSiblingCount($familyData['sisters'] ?? 0),
                    'updated_at' => now(),
                ]
            );

            // Update spiritual background (religion, caste, sect)
            $religionId = $normalizeInt($familyData['religionId'] ?? null);
            $religionName = trim((string) ($familyData['religion'] ?? ''));
            if (!$religionId && $religionName !== '') {
                $religion = Religion::whereRaw('LOWER(name) = ?', [strtolower($religionName)])->first();
                if (!$religion) {
                    $religion = new Religion();
                    $religion->name = $religionName;
                    $religion->save();
                }
                $religionId = $religion->id;
            }

            $casteId = $normalizeInt($familyData['casteId'] ?? null);
            $casteName = trim((string) ($familyData['caste'] ?? ''));
            if (!$casteId && $casteName !== '' && $religionId) {
                $caste = Caste::where('religion_id', $religionId)
                    ->whereRaw('LOWER(name) = ?', [strtolower($casteName)])
                    ->first();
                if (!$caste) {
                    $caste = new Caste();
                    $caste->name = $casteName;
                    $caste->religion_id = $religionId;
                    $caste->save();
                }
                $casteId = $caste->id;
            }

            SpiritualBackground::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'religion_id' => $religionId,
                    'caste_id' => $casteId,
                    'sect_id' => $normalizeInt($familyData['sectId'] ?? null),
                    'ethnicity' => $familyData['sect'] ?? null,
                ]
            );
        }

        if ($request->has('expectations')) {
            $expData = $request->input('expectations', []);

            $minAge = $normalizeInt($expData['min_age'] ?? null);
            $maxAge = $normalizeInt($expData['max_age'] ?? null);
            $minHeightFeet = $parseHeightToFeet($expData['min_height'] ?? null);

            $maritalStatusId = $normalizeInt($expData['maritalStatusId'] ?? null);
            $maritalStatusName = trim((string) ($expData['marital_status'] ?? ''));
            if (!$maritalStatusId && $maritalStatusName !== '' && strtolower($maritalStatusName) !== 'any') {
                $maritalStatus = MaritalStatus::whereRaw('LOWER(name) = ?', [strtolower($maritalStatusName)])->first();
                if ($maritalStatus) {
                    $maritalStatusId = $maritalStatus->id;
                }
            }

            $religionId = $normalizeInt($expData['religionId'] ?? null);
            $religionName = trim((string) ($expData['religion'] ?? ''));
            if (!$religionId && $religionName !== '' && strtolower($religionName) !== 'any') {
                $religion = Religion::whereRaw('LOWER(name) = ?', [strtolower($religionName)])->first();
                if (!$religion) {
                    $religion = new Religion();
                    $religion->name = $religionName;
                    $religion->save();
                }
                $religionId = $religion->id;
            }

            $languageId = $normalizeInt($expData['languageId'] ?? null);
            $languageName = '';
            if (!$languageId && array_key_exists('language', $expData)) {
                $languageCandidates = $normalizeStringList($expData['language']);
                $languageName = $languageCandidates[0] ?? '';
            }
            if (!$languageId && $languageName !== '' && strtolower($languageName) !== 'any') {
                $language = MemberLanguage::whereRaw('LOWER(name) = ?', [strtolower($languageName)])->first();
                if (!$language) {
                    $language = new MemberLanguage();
                    $language->name = $languageName;
                    $language->save();
                }
                $languageId = $language->id;
            }

            $residenceCountryId = $normalizeInt($expData['residenceCountryId'] ?? null);
            $residenceValue = trim((string) ($expData['residence'] ?? ''));
            if (!$residenceCountryId && $residenceValue !== '' && strtolower($residenceValue) !== 'any') {
                if (is_numeric($residenceValue)) {
                    $residenceCountryId = (int) $residenceValue;
                } else {
                    $country = Country::whereRaw('LOWER(name) = ?', [strtolower($residenceValue)])->first();
                    if ($country) {
                        $residenceCountryId = $country->id;
                    }
                }
            }

            $familyValueId = $normalizeInt($expData['familyValueId'] ?? null);

            PartnerExpectation::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'general' => $expData['general'] ?? null,
                    'residence_country_id' => $residenceCountryId,
                    'min_age' => $minAge,
                    'max_age' => $maxAge,
                    'height' => $minHeightFeet,
                    'marital_status_id' => $maritalStatusId,
                    'religion_id' => $religionId,
                    'language_id' => $languageId,
                    'family_value_id' => $familyValueId,
                    'age_importance' => $expData['age_importance'] ?? 'Dealbreaker',
                    'height_importance' => $expData['height_importance'] ?? 'Nice to have',
                    'marital_status_importance' => $expData['marital_status_importance'] ?? 'Dealbreaker',
                    'religion_importance' => $expData['religion_importance'] ?? 'Must have',
                    'language_importance' => $expData['language_importance'] ?? 'Nice to have',
                    'residence_importance' => $expData['residence_importance'] ?? 'Nice to have',
                ]
            );
        }

        if ($request->has('onboardingCompleted') && $request->input('onboardingCompleted')) {
            // Reload user and member from DB to get latest state (e.g. photo just uploaded)
            $user = $user->fresh();
            $member = $user->member;
            $missingFields = $this->getOnboardingMissingFields($user, $member);
            if (!empty($missingFields)) {
                \Log::warning('Onboarding incomplete for user ' . $user->id, ['missing' => $missingFields]);
                return response()->json([
                    'result' => false,
                    'message' => 'Missing: ' . implode(', ', $missingFields),
                    'missingFields' => $missingFields,
                ], 422);
            }
            $member->onboarding_completed = 1;
        }

        if ($user->isDirty()) {
            $user->save();
        }
        if ($member->isDirty()) {
            $member->save();
        }

        return response()->json([
            'result' => true,
            'message' => 'Profile updated successfully'
        ]);
    }

    /**
     * Check onboarding completeness. Returns empty array if complete,
     * otherwise returns list of human-readable missing field labels.
     */
    private function getOnboardingMissingFields(User $user, Member $member): array
    {
        $missing = [];

        $presentAddress = Address::where('user_id', $user->id)->where('type', 'present')->first();
        $spiritual = SpiritualBackground::where('user_id', $user->id)->first();
        $career = DB::table('careers')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->orderByDesc('present')
            ->orderByDesc('updated_at')
            ->first();
        $education = DB::table('education')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->orderByDesc('is_highest_degree')
            ->orderByDesc('updated_at')
            ->first();
        $physical = PhysicalAttribute::where('user_id', $user->id)->first();

        // Step 1: Personal
        if (trim((string) $user->first_name) === '') $missing[] = 'First Name';
        if (trim((string) $user->last_name) === '') $missing[] = 'Last Name';
        if (empty($member->gender)) $missing[] = 'Gender';
        if (empty($member->birthday)) $missing[] = 'Date of Birth';
        if (empty($member->marital_status_id)) $missing[] = 'Marital Status';

        // Step 2: Location & Religion
        if (!$presentAddress || empty($presentAddress->country_id)) $missing[] = 'Country';
        if (!$presentAddress || empty($presentAddress->state_id)) $missing[] = 'State';
        if (!$presentAddress || empty($presentAddress->city_id)) $missing[] = 'City';
        if (!$spiritual || empty($spiritual->religion_id)) $missing[] = 'Religion';
        if (!$spiritual || empty($spiritual->caste_id)) $missing[] = 'Caste';

        // Step 3: Career & Education
        if (!$career || trim((string) ($career->designation ?? '')) === '') $missing[] = 'Designation';
        if (!$career || trim((string) ($career->company ?? '')) === '') $missing[] = 'Hospital/Company';
        if (!$education || trim((string) ($education->degree ?? '')) === '') $missing[] = 'Degree';
        if (!$education || trim((string) ($education->institution ?? '')) === '') $missing[] = 'Institution';
        if (empty($member->annual_salary_range_id)) $missing[] = 'Income Range';

        // Step 4: Appearance
        if (!$physical || $physical->height === null || $physical->height === '') $missing[] = 'Height';
        if (!$physical || $physical->weight === null || $physical->weight === '') $missing[] = 'Weight';
        if (!$physical || trim((string) ($physical->complexion ?? '')) === '') $missing[] = 'Complexion';

        // Step 5: About Me
        if (trim((string) ($member->introduction ?? '')) === '') $missing[] = 'Introduction';

        // Step 6: Photo
        if (empty($user->photo)) $missing[] = 'Profile Photo';

        return $missing;
    }

    /**
     * Backward-compatible boolean wrapper used by get_full_profile_react.
     */
    private function isOnboardingDataComplete(User $user, Member $member): bool
    {
        return empty($this->getOnboardingMissingFields($user, $member));
    }

    public function download_biodata(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            abort(401);
        }

        try {
            $pdf = PDF::loadView('pdf.biodata_modern', compact('user'));
            $filename = 'Biodata-' . ($user->first_name ?? 'User') . '.pdf';

            // Use output() instead of download() to avoid mPDF calling exit()
            // which bypasses Laravel middleware (including CORS)
            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Content-Transfer-Encoding' => 'binary',
                'Cache-Control' => 'public, must-revalidate, max-age=0',
                'Pragma' => 'public',
            ]);
        } catch (\Exception $e) {
            \Log::error('Biodata PDF generation failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'result' => false,
                'message' => 'Failed to generate biodata PDF. Please try again.'
            ], 500);
        }
    }

    public function biodata_json(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'result' => false,
                'message' => 'Your session has expired. Please sign in again.',
            ], 401);
        }

        // Return user with all necessary related models, just like how the frontend uses it or how get_full_profile_react provides it.
        // Actually, the simplest approach that guarantees parity with what get_full_profile_react returns
        // is to either call it or return the exact same data structure.
        // But since this is specifically for Biodata, we'll return structured user.
        $user->load([
            'member',
            'member.marital_status',
            'member.mothereTongue',
            'education',
            'career',
            'families',
            'addresses.city',
            'addresses.state',
            'addresses.country',
            'spiritual_backgrounds.religion',
            'spiritual_backgrounds.sect',
            'spiritual_backgrounds.caste',
            'spiritual_backgrounds.family_value',
            'lifestyles',
            'physical_attributes',
            'partner_expectations.religion',
            'hobbies'
        ]);

        return response()->json([
            'result' => true,
            'data' => $user
        ]);
    }

    private function getMarriageIntentOptionSets(): array
    {
        $optionGroup = function (string $group): array {
            try {
                return ProfileOptionValue::where('group', $group)
                    ->where('is_active', true)
                    ->orderBy('sort_order', 'asc')
                    ->get(['value', 'label'])
                    ->map(function ($item) {
                        return [
                            'value' => (string) $item->value,
                            'label' => (string) ($item->label ?? $item->value),
                        ];
                    })
                    ->values()
                    ->toArray();
            } catch (\Exception $e) {
                return [];
            }
        };

        $maritalStatuses = MaritalStatus::orderBy('name')->get(['id', 'name']);
        if ($maritalStatuses->isEmpty()) {
            // Safety net: ensure onboarding always has usable marital-status options.
            foreach (['Single', 'Divorced', 'Widowed', 'Separated'] as $defaultStatus) {
                MaritalStatus::firstOrCreate(['name' => $defaultStatus]);
            }
            $maritalStatuses = MaritalStatus::orderBy('name')->get(['id', 'name']);
        }

        $maritalStatusOptions = $maritalStatuses->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'value' => $item->name, // Added value for compatibility
                'label' => $item->name, // Added label for compatibility
            ];
        })->values()->toArray();

        return [
            'genders' => $optionGroup('gender'),
            'marriageTimeline' => $optionGroup('marriage_timeline'),
            'relocationWillingness' => $optionGroup('relocation_willingness'),
            'seriousnessLevel' => $optionGroup('seriousness_level'),
            'dietOptions' => $optionGroup('diet'),
            'drinkOptions' => $optionGroup('drink'),
            'smokeOptions' => $optionGroup('smoke'),
            'propertyOptions' => $optionGroup('property'),
            'livingWithOptions' => $optionGroup('living_with'),
            'sleepScheduleOptions' => $optionGroup('sleep_schedule'),
            'workLocationOptions' => $optionGroup('work_location_type'),
            'familyTypeOptions' => $optionGroup('family_type'),
            'immigrationStatusOptions' => $optionGroup('immigration_status'),
            'personalityTags' => $optionGroup('personality_tags'),
            'personalValues' => $optionGroup('personal_values'),
            'communityValues' => $optionGroup('community_values'),
            // Keep both keys for backward compatibility with older frontend builds.
            'maritalStatuses' => $maritalStatusOptions,
            'marital_statuses' => $maritalStatusOptions,
            'religions' => Religion::orderBy('name')->get(['id', 'name'])->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'value' => $item->id,
                    'label' => $item->name,
                ];
            })->values()->toArray(),
            'castes' => Caste::orderBy('name')->get(['id', 'name', 'religion_id'])->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'religion_id' => $item->religion_id,
                    'value' => $item->id,
                    'label' => $item->name,
                ];
            })->values()->toArray(),
            'languages' => MemberLanguage::orderBy('name')->get(['id', 'name'])->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'value' => $item->name,
                    'label' => $item->name,
                ];
            })->values()->toArray(),
            'countries' => Country::where('status', 1)->orderByRaw("CASE WHEN code = 'PK' THEN 0 ELSE 1 END")->orderBy('name')->get(['id', 'name', 'code'])->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'code' => $item->code,
                    'value' => $item->name,
                    'label' => $item->name,
                ];
            })->values()->toArray(),
            'familyValues' => FamilyValue::orderBy('name')->get(['id', 'name'])->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'value' => $item->id,
                    'label' => $item->name,
                ];
            })->values()->toArray(),
        ];
    }
}


<?php

namespace App\Http\Resources\PublicProfile;

use App\Http\Resources\Profile\OnBehalfResource;
use App\Models\OnBehalf;
use App\Utility\MemberUtility;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BasicInformation extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array|Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {

        $age = MemberUtility::member_age($this->id);
        $dateOfBirth = MemberUtility::member_birthdate($this->id);
        $photoRequestInfo = MemberUtility::member_profile_photo_request_info($this->id);
        $galleryRequestInfo = MemberUtility::member_gallery_image_request_info($this->id);
        $profilePhotoBlur = MemberUtility::member_profile_photo_blur($this->id);
        $onBehalf = $this->member->on_behalves_id ? OnBehalf::find($this->member->on_behalves_id) : null;
        $displayNameParts = MemberUtility::member_display_name_parts($this->id, $this->first_name, $this->last_name);

        return [
            'firs_name' => $displayNameParts['first_name'],
            'last_name' => $displayNameParts['last_name'],
            'code' => $this->code,
            'age' => $age,
            'religion' => $this->spiritual_backgrounds->religion->name ?? '',
            'caste' => $this->spiritual_backgrounds->caste->name ?? '',
            'date_of_birth' => $dateOfBirth,
            'onbehalf' => $onBehalf ? new OnBehalfResource($onBehalf) : null,
            'no_of_children' => $this->member->children ?? '',
            'gender' => $this->member->gender == 1 ? 'Male' : 'Female',
            'phone' => $this->phone ?? '',
            'maritial_status' => $this->member->marital_status ? $this->member->marital_status->name : '',
            'photo' => show_profile_picture($this) ? (uploaded_asset($this->photo) ?? gender_avatar($this->member)) : gender_avatar($this->member),
            'profile_photo_blur' => $profilePhotoBlur,
            'profile_photo_request_state' => $photoRequestInfo['profile_photo_request_state'],
            'profile_photo_request_text' => $photoRequestInfo['profile_photo_request_text'],
            'profile_photo_request_requested' => $photoRequestInfo['profile_photo_request_requested'],
            'profile_photo_request_approved' => $photoRequestInfo['profile_photo_request_approved'],
            'profile_photo_request_id' => $photoRequestInfo['profile_photo_request_id'],
            'profile_photo_request_required' => $photoRequestInfo['profile_photo_request_required'],
            'profile_photo_accessible' => $photoRequestInfo['profile_photo_accessible'],
            'profile_photo_exists' => $photoRequestInfo['profile_photo_exists'],
            'gallery_image_request_state' => $galleryRequestInfo['gallery_image_request_state'],
            'gallery_image_request_text' => $galleryRequestInfo['gallery_image_request_text'],
            'gallery_image_request_requested' => $galleryRequestInfo['gallery_image_request_requested'],
            'gallery_image_request_approved' => $galleryRequestInfo['gallery_image_request_approved'],
            'gallery_image_request_id' => $galleryRequestInfo['gallery_image_request_id'],
            'gallery_image_request_required' => $galleryRequestInfo['gallery_image_request_required'],
            'gallery_image_accessible' => $galleryRequestInfo['gallery_image_accessible'],
            'gallery_image_exists' => $galleryRequestInfo['gallery_image_exists'],

        ];
    }
}

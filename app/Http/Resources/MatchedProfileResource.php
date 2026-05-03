<?php

namespace App\Http\Resources;

use App\Models\ReportedUser;
use App\Models\Shortlist;
use App\Models\ViewGalleryImage;
use App\Utility\MemberUtility;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchedProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {

        if ($this->user != null) {
            $photoRequestInfo = MemberUtility::member_profile_photo_request_info($this->id);
            $galleryRequestInfo = MemberUtility::member_gallery_image_request_info($this->id);
            $gallery_view_resquest_status = ViewGalleryImage::where('user_id', $this->id)->where('requested_by', auth()->id())->where('status', 1)->first();
            $profilePhotoBlur = MemberUtility::member_profile_photo_blur($this->id);

            $avatar_image = $this->user->member->gender == 1 ? 'assets/img/avatar-place.png' : 'assets/img/female-avatar-place.png';
            $profile_picture_show = show_profile_picture($this->user);
            return [
                'user_id'              => $this->match_id ?? '',
                'code'                 => $this->user->code ?? '',
                'membership'           => $this->user->membership ?? '',
                'name'                 => MemberUtility::member_display_name($this->match_id, $this->user->first_name ?? '', $this->user->last_name ?? ''),
                'photo'                => $profile_picture_show ? uploaded_asset($this->user->photo) : static_asset($avatar_image) ?? '',
                'profile_photo_blur'   => $profilePhotoBlur,
                'age'                  => MemberUtility::member_age($this->match_id),
                'height'               => !empty($this->user->physical_attributes->height) ? $this->user->physical_attributes->height : '' ?? '',
                'marital_status'       => !empty($this->user->member->marital_status->name) ? $this->user->member->marital_status->name : '' ?? '',
                'religion'             => MemberUtility::member_religion($this->match_id) ?? '',
                'caste'                => !empty($this->user->spiritual_backgrounds->caste->name) ? $this->user->spiritual_backgrounds->caste->name . ', ' : "",
                'sub_caste'            => !empty($this->user->spiritual_backgrounds->sub_caste->name) ? $this->user->spiritual_backgrounds->sub_caste->name : "",
                "report_status"        => ReportedUser::where('user_id', $this->id)->where('reported_by', auth()->id())->first() ? true : false,
                "shortlist_status"    => Shortlist::where('user_id', $this->id)->where('shortlisted_by', auth()->id())->first() ? 1 : 0,
                'profile_view_request_status'   => $photoRequestInfo['profile_photo_request_approved'],
                'profile_photo_request_state'    => $photoRequestInfo['profile_photo_request_state'],
                'profile_photo_request_text'     => $photoRequestInfo['profile_photo_request_text'],
                'profile_photo_request_requested' => $photoRequestInfo['profile_photo_request_requested'],
                'profile_photo_request_approved'  => $photoRequestInfo['profile_photo_request_approved'],
                'profile_photo_request_required'  => $photoRequestInfo['profile_photo_request_required'],
                'profile_photo_accessible'        => $photoRequestInfo['profile_photo_accessible'],
                'profile_photo_exists'            => $photoRequestInfo['profile_photo_exists'],
                'gallery_image_request_state'     => $galleryRequestInfo['gallery_image_request_state'],
                'gallery_image_request_text'      => $galleryRequestInfo['gallery_image_request_text'],
                'gallery_image_request_requested' => $galleryRequestInfo['gallery_image_request_requested'],
                'gallery_image_request_approved'  => $galleryRequestInfo['gallery_image_request_approved'],
                'gallery_image_request_id'        => $galleryRequestInfo['gallery_image_request_id'],
                'gallery_image_request_required'  => $galleryRequestInfo['gallery_image_request_required'],
                'gallery_image_accessible'        => $galleryRequestInfo['gallery_image_accessible'],
                'gallery_image_exists'            => $galleryRequestInfo['gallery_image_exists'],
                'gallery_view_request_status'   => $gallery_view_resquest_status ? true : false,


            ];
        }
    }
}

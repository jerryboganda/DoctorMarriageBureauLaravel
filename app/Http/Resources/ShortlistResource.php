<?php

namespace App\Http\Resources;

use App\Utility\MemberUtility;
use App\Models\ExpressInterest;
use App\Models\ReportedUser;
use App\Models\Shortlist;
use App\Models\ViewGalleryImage;
use App\Models\User;
use Illuminate\Http\Resources\Json\JsonResource;

class ShortlistResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $user = User::find($this->user_id);
        if ($user != null) {
            $photoRequestInfo = MemberUtility::member_profile_photo_request_info($this->user_id);
            $galleryRequestInfo = MemberUtility::member_gallery_image_request_info($this->user_id);
            $gallery_view_resquest_status = ViewGalleryImage::where('user_id', $this->user_id)->where('requested_by', auth()->id())->where('status', 1)->first();
            $shortlist = Shortlist::where('user_id', $this->user_id)->where('shortlisted_by', auth()->id())->first();
            $avatar_image = $user->member->gender == 1 ? 'assets/img/avatar-place.png' : 'assets/img/female-avatar-place.png';
            $profile_picture_show = show_profile_picture($this->user);
            $package_update_alert = get_setting('full_profile_show_according_to_membership') == 1 && auth()->user()->membership == 1 ? true : false;
            $do_interest = ExpressInterest::where('user_id', $this->user_id)->where('interested_by', auth()->id())->first();
            $received_interest = ExpressInterest::where('user_id', auth()->id())->where('interested_by', $this->user_id)->first();
            $interest = ExpressInterest::where('user_id', $this->user_id)->where('interested_by', auth()->user()->id)->first();
            $profile_reported = ReportedUser::where('user_id', $this->user_id)->where('reported_by', auth()->id())->first();

            return [
                'id'                   => $this->id,
                'user_id'              => $this->user_id,
                'package_update_alert' => $package_update_alert,
                'photo'                => $profile_picture_show ? uploaded_asset($this->user->photo) : static_asset($avatar_image),
                'name'                 => MemberUtility::member_display_name($this->user_id, $this->user->first_name, $this->user->last_name),
                'age'                  => MemberUtility::member_age($this->user_id),
                'religion'             => MemberUtility::member_religion($this->user_id),
                'country'              => MemberUtility::member_country($this->user_id),
                'membership'           => $this->user->membership,
                'code'                 => $this->user->code,
                'height'               => $this->user->physical_attributes->height ??  '',
                'mothere_tongue'       => MemberUtility::member_mothere_tongue($this->user_id),
                'express_interest'     => $interest ? true : false,
                'interest_status'      => ($do_interest ? 'sent interest' : $received_interest) ? 'received interest' : 'no interest',
                'shortlist_status'     => $shortlist ? 1 : 0,
                'report_status'        => $profile_reported ? true : false,
                'profile_view_resquest_status'   => $photoRequestInfo['profile_photo_request_approved'],
                'profile_photo_request_state'     => $photoRequestInfo['profile_photo_request_state'],
                'profile_photo_request_text'      => $photoRequestInfo['profile_photo_request_text'],
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
                'gallery_view_resquest_status'   => $gallery_view_resquest_status ? true : false,
            ];
        }
    }
}

<?php

namespace App\Http\Resources;

use App\Models\ViewProfilePicture;
use App\Models\User;
use App\Utility\MemberUtility;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileImageRequest extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $view_profile_images = ViewProfilePicture::find($this->id);
        $user = User::where('id', $view_profile_images->requested_by)->first();
        if ($user != null) {
            $photoRequestInfo = MemberUtility::member_profile_photo_request_info($user->id);
            $requestState = (int) $view_profile_images->status === 1 ? 'approved' : 'pending';
            return [
                'id' => $this->id,
                'photo' => uploaded_asset($user->photo) ?? gender_avatar($user?->member),
                'name' => $user->first_name . $user->last_name,
                'date_of_birth' => MemberUtility::member_age($user->id),
                'status' => $view_profile_images->status,
                'photo_request_state' => $requestState,
                'photo_request_text' => $requestState === 'approved'
                    ? translate('Photo Access Granted')
                    : translate('Photo Access Requested'),
                'profile_photo_request_state' => $requestState,
                'profile_photo_request_text' => $requestState === 'approved'
                    ? translate('Photo Access Granted')
                    : translate('Photo Access Requested'),
                'profile_photo_request_requested' => true,
                'profile_photo_request_approved' => $requestState === 'approved',
                'profile_photo_request_required' => $photoRequestInfo['profile_photo_request_required'],
                'profile_photo_accessible' => $photoRequestInfo['profile_photo_accessible'],
                'profile_photo_exists' => $photoRequestInfo['profile_photo_exists'],
            ];
        }
    }
}

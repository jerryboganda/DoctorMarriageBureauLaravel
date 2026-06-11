<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Models\ViewProfilePicture;
use App\Utility\MemberUtility;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileImageRequest extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array|Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $view_profile_images = ViewProfilePicture::find($this->id);
        $user = User::where('id', $view_profile_images->requested_by)->first();
        if ($user != null) {
            $requestState = (int) $view_profile_images->status === 1 ? 'approved' : 'pending';

            return [
                'id' => $this->id,
                'profile_pic_view_request_id' => $this->id,
                'requester_id' => $user->id,
                'requested_by' => $user->id,
                'owner_id' => $view_profile_images->user_id,
                'photo' => uploaded_asset($user->photo) ?? gender_avatar($user?->member),
                'name' => trim($user->first_name.' '.$user->last_name),
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
                'profile_photo_request_required' => true,
                'profile_photo_accessible' => $requestState === 'approved',
                'profile_photo_exists' => ! empty($user->photo),
            ];
        }
    }
}

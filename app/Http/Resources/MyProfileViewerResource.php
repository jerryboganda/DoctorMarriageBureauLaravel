<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use App\Utility\MemberUtility;
use App\Models\ProfileViewer;
use App\Models\User;
use Illuminate\Http\Resources\Json\JsonResource;

class MyProfileViewerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $profileViewer = ProfileViewer::find($this->id);
        $user = User::find($profileViewer->user_id);
        $viewedBy = User::find($profileViewer->viewed_by);
        if ($user != null && $user->member) {
            $package_update_alert = get_setting('full_profile_show_according_to_membership') == 1 && auth()->user()->membership == 1 ? true : false;
            $avatar_image = $user->member->gender == 1 ? 'assets/img/avatar-place.png' : 'assets/img/female-avatar-place.png';
            $profile_picture_show = show_profile_picture($user);

            return [
                'user_id'              => $viewedBy->id,
                'package_update_alert' => $package_update_alert,
                'photo'                => $profile_picture_show ? uploaded_asset($user->photo) : static_asset($avatar_image),
                'name'                 => $viewedBy->first_name . ' ' . $viewedBy->last_name,
                'age'                  => Carbon::parse($viewedBy->member->birthday)->age,
                'religion'             => MemberUtility::member_religion($viewedBy->id),
                'country'              => MemberUtility::member_country($viewedBy->id),
                'mothere_tongue'       => MemberUtility::member_mothere_tongue($viewedBy->id)
            ];
        }
    }
}

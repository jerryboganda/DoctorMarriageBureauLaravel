<?php

namespace App\Http\Resources;

use App\Utility\MemberUtility;
use App\Models\ExpressInterest;
use Illuminate\Http\Resources\Json\JsonResource;

class MyInterestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $interest = $this->resource instanceof ExpressInterest
            ? $this->resource
            : ExpressInterest::with('user.member')->find($this->id);

        $user = $interest?->user;
        if ($user == null || $user->member == null) {
            return [];
        }

        $package_update_alert = get_setting('full_profile_show_according_to_membership') == 1 && auth()->user()->membership == 1 ? true : false;
        $avatar_image = $user->member->gender == 1 ? 'assets/img/avatar-place.png' : 'assets/img/female-avatar-place.png';
        $profile_picture_show = show_profile_picture($user);

        return [
            'id'                   => $interest->id,
            'user_id'              => $interest->user_id,
            'package_update_alert' => $package_update_alert,
            'photo'                => $profile_picture_show ? uploaded_asset($user->photo) : static_asset($avatar_image),
            'name'                 => MemberUtility::member_display_name($interest->user_id, $user->first_name, $user->last_name),
            'age'                  => MemberUtility::member_age($interest->user_id),
            'religion'             => MemberUtility::member_religion($interest->user_id),
            'country'              => MemberUtility::member_country($interest->user_id),
            'mothere_tongue'       => MemberUtility::member_mothere_tongue($interest->user_id),
            'status'               => $interest->status == 1 ? 'Approved' : 'Pending',
            'proposal_status'      => $interest->status == 1 ? 'sent_accepted' : 'sent_pending',
            'proposal_updated_at'  => optional($interest->updated_at)->toIso8601String(),
            'is_verified'          => ($user->approved == 1 && !empty($user->verification_info)),
        ];
    }
}

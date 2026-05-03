<?php

namespace App\Http\Resources;

use App\Utility\MemberUtility;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpressInterestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $interestedBy = $this->interestedby;
        if ($interestedBy != null && $interestedBy->member != null) {
            $package_update_alert = (get_setting('full_profile_show_according_to_membership') == 1 && auth()->user()->membership == 1) ? true : false;
            $default_image = $interestedBy->member->gender == 1 ? static_asset('assets/img/avatar-place.png') : static_asset('assets/img/female-avatar-place.png');
            return [
                'id'                   => $this->id,
                'user_id'              => $this->interested_by,
                'package_update_alert' => $package_update_alert,
                'photo'                => uploaded_asset($interestedBy->photo) ?? $default_image,
                'name'                 => MemberUtility::member_display_name($this->interested_by, $interestedBy->first_name, $interestedBy->last_name),
                'age'                  => MemberUtility::member_age($this->interested_by),
                'status'               => $this->status == 1 ? 'Approved' : 'Pending',
                'religion'             => MemberUtility::member_religion($this->interested_by),
                'country'              => MemberUtility::member_country($this->interested_by),
                'mothere_tongue'       => MemberUtility::member_mothere_tongue($this->interested_by),
                'proposal_status'      => $this->status == 1 ? 'received_accepted' : 'received_pending',
                'proposal_updated_at'  => optional($this->updated_at)->toIso8601String(),
                'is_verified'          => ($interestedBy->approved == 1 && !empty($interestedBy->verification_info)),
            ];
        }

        return [];
    }
}

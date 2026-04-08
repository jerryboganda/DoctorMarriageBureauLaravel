<?php

namespace App\Http\Resources;

use App\Models\ViewGalleryImage;
use App\Models\ViewProfilePicture;
use App\Utility\MemberUtility;
use Illuminate\Support\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

class ActiveUserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $avatar_image = $this->member->gender == 1 ? 'assets/img/avatar-place.png' : 'assets/img/female-avatar-place.png';
        $profile_picture_show = show_profile_picture($this);
        $package_update_alert = get_setting('full_profile_show_according_to_membership') == 1 && auth()->user()->membership == 1 ? true : false;

        return [
            'id'                   => $this->id,
            'user_id'              => $this->id,
            'code'                 => $this->code,
            'membership'           => $this->membership,
            'first_name'           => $this->first_name,
            'last_name'            => $this->last_name,
            'name'                 => $this->first_name . ' ' . $this->last_name,
            'gender'               => $this->member->gender,
            'photo'                => $profile_picture_show ? uploaded_asset($this->photo) : static_asset($avatar_image),
            'avatarUrl'            => $profile_picture_show ? uploaded_asset($this->photo) : static_asset($avatar_image),
            'age'                  => !empty($this->member->birthday) ? Carbon::parse($this->member->birthday)->age : '',
            'country'              => MemberUtility::member_country($this->id),
            'location'             => MemberUtility::member_country($this->id),
            'specialty'            => $this->career->first()?->designation ?? $this->member->specialization ?? 'Medical Professional',
            'hospital'             => $this->career->first()?->company ?? 'N/A',
            'matchPercentage'      => rand(85, 98), // Placeholder for Match Tuner logic
            'isVerified'           => $this->approved == 1,
            'height'               => !empty($this->physical_attributes->height) ? $this->physical_attributes->height : '',
            'religion'             => MemberUtility::member_religion($this->id),
            'mothere_tongue'       => MemberUtility::member_mothere_tongue($this->id),
            'marital_status'       => !empty($this->member->marital_status->name) ? $this->member->marital_status->name : '',
            'caste'                => !empty($this->spiritual_backgrounds->caste->name) ? $this->spiritual_backgrounds->caste->name . ', ' : "",
            'package_update_alert' => $package_update_alert,
            'interest_status'      => MemberUtility::member_interest_info($this->id)['interest_status'],
            'interest_text'        => MemberUtility::member_interest_info($this->id)['interest_text'],
            'shortlist_status'     => MemberUtility::member_shortlist_info($this->id)['shortlist_status'],
            'shortlist_text'       => MemberUtility::member_shortlist_info($this->id)['shortlist_text'],
            'report_status'        => MemberUtility::member_report_status($this->id) ? true : false,
            'is_agent_pick'       => $this->member->is_agent_pick == 1,
            'is_high_intent'      => $this->member->is_high_intent == 1,
            'isAgentPick'         => $this->member->is_agent_pick == 1,
            'isHighIntent'        => $this->member->is_high_intent == 1,
            'travel_mode'         => $this->member->travel_mode == 1,
            'is_visible'          => $this->member->is_visible == 1,
            'profile_view_resquest_status' =>  ViewProfilePicture::where('user_id', $this->id)->where('requested_by', auth()->id())->where('status', 1)->first() ? true : false,
            'gallery_view_resquest_status' =>  ViewGalleryImage::where('user_id', $this->id)->where('requested_by', auth()->id())->where('status', 1)->first() ? true : false,
            'education' => $this->education->count() > 0 ? [
                'degree' => $this->education->first()->degree ?? '',
                'institution' => $this->education->first()->institution ?? '',
            ] : null,
            'career' => $this->career->count() > 0 ? [
                'position' => $this->career->first()->designation ?? '',
                'institution' => $this->career->first()->company ?? '',
                'duration' => $this->career->first()->present ? 'Present' : ($this->career->first()->end ? ($this->career->first()->start . ' - ' . $this->career->first()->end) : ''),
            ] : null,
            'educations' => $this->education->map(function ($edu) {
                return [
                    'degree' => $edu->degree ?? '',
                    'institution' => $edu->institution ?? '',
                    'start' => $edu->start ?? '',
                    'end' => $edu->end ?? '',
                    'isHighestDegree' => (bool) ($edu->is_highest_degree ?? false),
                ];
            })->values(),
            'careers' => $this->career->map(function ($c) {
                return [
                    'position' => $c->designation ?? '',
                    'institution' => $c->company ?? '',
                    'start' => $c->start ?? '',
                    'end' => $c->end ?? '',
                    'present' => (bool) ($c->present ?? false),
                    'duration' => $c->present ? 'Present' : ($c->end ? ($c->start . ' - ' . $c->end) : ''),
                ];
            })->values(),
        ];
    }
}

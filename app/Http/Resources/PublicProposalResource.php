<?php

namespace App\Http\Resources;

use App\Utility\MemberUtility;
use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicProposalResource extends JsonResource
{
    /**
     * Public proposal resource for landing page.
     * Returns sanitised profile data without exposing private information.
     * No authentication required.
     */
    public function toArray($request)
    {
        $avatar_image = $this->member->gender == 1
            ? 'assets/img/avatar-place.png'
            : 'assets/img/female-avatar-place.png';

        $avatar_fallback = static_asset($avatar_image);

        // Show real photo only if photo_approved & privacy allows public viewing
        $photo = $avatar_fallback;
        $profile_picture_privacy = get_setting('profile_picture_privacy');
        if (
            $profile_picture_privacy === 'all'
            && $this->photo !== null
            && $this->photo_approved == 1
        ) {
            $photo = uploaded_asset($this->photo) ?? $avatar_fallback;
        }

        $age = !empty($this->member->birthday)
            ? Carbon::parse($this->member->birthday)->age
            : null;

        return [
            'id'           => $this->id,
            'code'         => $this->code,
            'first_name'   => $this->first_name,
            'last_name'    => mb_substr($this->last_name ?? '', 0, 1) . '.',
            'gender'       => $this->member->gender,            // 1 = Male, 2 = Female
            'age'          => $age,
            'photo'        => $photo,
            'location'     => MemberUtility::member_country($this->id),
            'religion'     => MemberUtility::member_religion($this->id),
            'mother_tongue'=> MemberUtility::member_mothere_tongue($this->id),
            'marital_status'=> optional($this->member->marital_status)->name,
            'height'       => optional($this->physical_attributes)->height,
            'specialty'    => $this->career->first()?->designation
                              ?? $this->member->specialization
                              ?? 'Medical Professional',
            'education'    => $this->education->count() > 0
                ? ($this->education->first()->degree ?? null)
                : null,
            'is_verified'  => ($this->approved == 1) && !empty($this->verification_info),
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Models\ViewGalleryImage;
use App\Models\User;
use App\Utility\MemberUtility;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryImageRequest extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $view_gallery_images = ViewGalleryImage::find($this->id);
        $user = User::where('id', $view_gallery_images->requested_by)->first();
        if ($user != null) {
            $galleryRequestInfo = MemberUtility::member_gallery_image_request_info($user->id);
            $requestState = (int) $view_gallery_images->status === 1 ? 'approved' : 'pending';
            return [
                'id' => $this->id,
                'photo' => uploaded_asset($user->photo) ?? gender_avatar($user?->member),
                'name' => $user->first_name . $user->last_name,
                'date_of_birth' => MemberUtility::member_birthdate($user->id),
                'age' => MemberUtility::member_age($user->id),
                'status' => $view_gallery_images->status,
                'gallery_image_request_state' => $requestState,
                'gallery_image_request_text' => $requestState === 'approved'
                    ? translate('Gallery Access Granted')
                    : translate('Gallery Access Requested'),
                'gallery_image_request_requested' => true,
                'gallery_image_request_approved' => $requestState === 'approved',
                'gallery_image_request_required' => $galleryRequestInfo['gallery_image_request_required'],
                'gallery_image_accessible' => $galleryRequestInfo['gallery_image_accessible'],
                'gallery_image_exists' => $galleryRequestInfo['gallery_image_exists'],
            ];
        }
    }
}

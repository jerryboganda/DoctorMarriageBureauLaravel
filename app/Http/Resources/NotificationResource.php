<?php

namespace App\Http\Resources;

use App\Models\ExpressInterest;
use App\Models\User;
use App\Models\ViewProfilePicture;
use Carbon\Carbon;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    private function decodeNotificationData(): array
    {
        if (is_array($this->data)) {
            return $this->data;
        }

        $decoded = json_decode($this->data, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array|Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $check = true;
        $notifyData = $this->decodeNotificationData();
        $notifyType = (string) ($notifyData['type'] ?? 'system');
        $notifyBy = $notifyData['notify_by'] ?? null;
        $user = $notifyBy ? User::find($notifyBy) : null;

        if ($notifyType === 'express_interest') {
            $interestData = ExpressInterest::find($notifyData['info_id'] ?? null);
            $check = ! empty($interestData);
        }

        if ($notifyType === 'profile_picture_view') {
            $profilePhotoRequest = ViewProfilePicture::find($notifyData['info_id'] ?? null);
            $notifyData['profile_photo_request_state'] = $profilePhotoRequest
                ? ((int) $profilePhotoRequest->status === 1 ? 'approved' : 'pending')
                : 'removed';
            $notifyData['profile_photo_request_handled'] = ! $profilePhotoRequest
                || (int) $profilePhotoRequest->status === 1;
        }

        $avatarImage = 'assets/img/avatar-place.png';
        $profilePictureShow = false;
        if ($user) {
            $avatarImage = optional($user->member)->gender == 1
                ? 'assets/img/avatar-place.png'
                : 'assets/img/female-avatar-place.png';
            $profilePictureShow = show_profile_picture($user);
        }

        $message = trim((string) ($notifyData['message'] ?? ''));
        $title = trim((string) ($notifyData['title'] ?? ''));

        if ($title === '') {
            $title = $message !== '' ? $message : 'Notification';
        }

        return [
            'check' => $check,
            'notification_id' => $this->id,
            'type' => $notifyType,
            'notify_by' => $notifyBy,
            'sender_name' => $user ? trim(($user->first_name ?? '').' '.($user->last_name ?? '')) : null,
            'photo' => $profilePictureShow && ! empty($user?->photo)
                ? uploaded_asset($user->photo)
                : static_asset($avatarImage),
            'title' => $title,
            'message' => $message !== '' ? $message : 'No details available',
            'body' => $message !== '' ? $message : '',
            'full_message' => $message !== '' ? $message : 'No details available',
            'time' => Carbon::parse($this->created_at)->diffForHumans(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'read_at' => $this->read_at == null ? 'New' : 'read',
            'is_read' => $this->read_at != null,
            'route' => $notifyData['route'] ?? null,
            'info_id' => $notifyData['info_id'] ?? null,
            'raw_data' => $notifyData,
        ];
    }
}

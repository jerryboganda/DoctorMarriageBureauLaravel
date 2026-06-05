<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\GalleryImageRequest;
use App\Http\Resources\GalleryImageResource;
use App\Models\GalleryImage;
use App\Models\Member;
use App\Models\User;
use App\Models\ViewGalleryImage;
use App\Notifications\DbStoreNotification;
use App\Services\FirbaseNotification;
use App\Utility\EmailUtility;
use DB;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Kutia\Larafirebase\Facades\Larafirebase;
use Notification;

class GalleryImageController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        $gallery_image_id = GalleryImage::where('user_id', request()->user()->id)->latest()->get();

        return GalleryImageResource::collection($gallery_image_id)->additional([
            'result' => true,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return Response
     */
    public function store(Request $request)
    {
        try {
            // Validate file exists
            if (! $request->hasFile('gallery_image')) {
                \Log::error('Gallery upload failed: No file received', [
                    'user_id' => auth()->id(),
                    'files' => $request->allFiles(),
                    'all' => $request->all(),
                ]);

                return $this->failure_message('No image file received. Please select an image to upload.');
            }

            $file = $request->file('gallery_image');
            if (! $file->isValid()) {
                \Log::error('Gallery upload failed: Invalid file', [
                    'user_id' => auth()->id(),
                    'error' => $file->getErrorMessage(),
                ]);

                return $this->failure_message('Invalid file upload: '.$file->getErrorMessage());
            }

            $userId = auth()->user()->id;

            // Check package validity
            if (! package_validity($userId)) {
                return $this->failure_message('Your package has expired. Please update your package.');
            }

            // Check remaining uploads
            $remaining = get_remaining_package_value($userId, 'remaining_photo_gallery');
            if ($remaining <= 0) {
                return $this->failure_message('You have 0 remaining gallery photo uploads. Please update your package.');
            }

            // Upload the image
            $photo = upload_api_file($file);

            if (! $photo) {
                \Log::error('Gallery upload failed: upload_api_file returned null', [
                    'user_id' => $userId,
                    'file_name' => $file->getClientOriginalName(),
                ]);

                return $this->failure_message('Failed to process image. Please try again.');
            }

            // Create gallery image record
            $galleryImage = GalleryImage::create([
                'user_id' => $userId,
                'image' => $photo,
                'privacy_level' => $request->privacy_level ?? 'public',
            ]);

            // Decrement remaining count
            $member = Member::where('user_id', $userId)->first();
            $member->remaining_photo_gallery = max(0, $member->remaining_photo_gallery - 1);
            $member->save();

            \Log::info('Gallery image uploaded successfully', [
                'user_id' => $userId,
                'gallery_image_id' => $galleryImage->id,
                'upload_id' => $photo,
            ]);

            return $this->success_message('Gallery image uploaded successfully.');

        } catch (\Exception $e) {
            \Log::error('Gallery upload exception', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->failure_message('Upload failed: '.$e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  int  $id
     * @return Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return Response
     */
    public function destroy($id)
    {
        if (GalleryImage::destroy($id)) {
            return $this->success_message('Image deleted successfully.');
        }

        return $this->failure_message('Sorry! Something went wrong.');
    }

    /**
     * Set a gallery image as primary/main photo
     *
     * @param  int  $id
     * @return Response
     */
    public function set_primary($id)
    {
        $user_id = auth()->id();
        $image = GalleryImage::where('id', $id)->where('user_id', $user_id)->first();

        if (! $image) {
            return $this->failure_message('Image not found.');
        }

        // Reset all images to non-primary first
        GalleryImage::where('user_id', $user_id)->update(['is_main_photo' => false]);

        // Set selected image as primary
        $image->is_main_photo = true;
        $image->save();

        return $this->success_message('Image set as primary successfully.');
    }

    /**
     * Toggle privacy level of a gallery image
     *
     * @param  int  $id
     * @return Response
     */
    public function toggle_private($id)
    {
        $user_id = auth()->id();
        $image = GalleryImage::where('id', $id)->where('user_id', $user_id)->first();

        if (! $image) {
            return $this->failure_message('Image not found.');
        }

        // Toggle between 'public' and 'private'/'vault'
        $currentPrivacy = $image->privacy_level ?? 'public';
        $image->privacy_level = in_array($currentPrivacy, ['private', 'vault']) ? 'public' : 'vault';
        $image->save();

        return response()->json([
            'result' => true,
            'message' => 'Privacy updated successfully.',
            'privacy_level' => $image->privacy_level,
            'is_private' => in_array($image->privacy_level, ['private', 'vault']),
        ]);
    }

    /**
     * Set a gallery image as the user's profile avatar
     * Also sets it as the main gallery photo
     *
     * @param  int  $id
     * @return Response
     */
    public function set_as_avatar($id)
    {
        $user_id = auth()->id();
        $image = GalleryImage::where('id', $id)->where('user_id', $user_id)->first();

        if (! $image) {
            return $this->failure_message('Image not found.');
        }

        // Set as main gallery photo
        GalleryImage::where('user_id', $user_id)->update(['is_main_photo' => false]);
        $image->is_main_photo = true;
        // Main photo must be public
        $image->privacy_level = 'public';
        $image->save();

        // Also update the user's profile avatar
        $user = User::find($user_id);
        $user->photo = $image->image;
        $user->save();

        return response()->json([
            'result' => true,
            'message' => 'Photo set as profile picture successfully.',
            'photo_url' => uploaded_asset($image->image),
        ]);
    }

    public function image_view_request()
    {
        $my_gallery_image_view_requests = DB::table('view_gallery_images')
            ->orderBy('id', 'desc')
            ->where('user_id', auth()->id())
            ->join('users', 'view_gallery_images.user_id', '=', 'users.id')
            ->select('view_gallery_images.id')
            ->distinct()
            ->paginate(10);

        return GalleryImageRequest::collection($my_gallery_image_view_requests);
        // return $this->response_data($my_gallery_image_view_requests);
    }

    public function store_image_view_request(Request $request)
    {
        $auth_user = auth()->user();
        $exist_check = ViewGalleryImage::where('user_id', $request->id)->where('requested_by', $auth_user->id)->first();
        if (! $exist_check) {
            $view_gallert_image = new ViewGalleryImage;
            $view_gallert_image->user_id = $request->id;
            $view_gallert_image->requested_by = $auth_user->id;
            if ($view_gallert_image->save()) {
                $member = Member::where('user_id', $auth_user->id)->first();
                $member->remaining_gallery_image_view = $member->remaining_gallery_image_view - 1;
                $member->save();

                $notify_user = User::where('id', $request->id)->first();

                // View Profile Picture Store Notification for member
                try {
                    $notify_type = 'gallery_image_view';
                    $id = null;
                    $notify_by = $auth_user->id;
                    $info_id = $view_gallert_image->id;
                    $message = $auth_user->first_name.' '.$auth_user->last_name.' '.translate(' wants to see your gallery images.');
                    $route = 'gallery-image-view-request.index';

                    // fcm
                    if (get_setting('firebase_push_notification') == 1) {
                        self::sendFirebaseNotification($notify_user->fcm_token, $notify_user, $notify_type, $message, $notify_by);
                    }
                    // end of fcm

                    Notification::send($notify_user, new DbStoreNotification($notify_type, $id, $notify_by, $info_id, $message, $route));
                } catch (\Exception $e) {
                    // dd($e);
                }

                // View Profile Picture email send to member
                if ($notify_user->email != null && get_email_template('gallery_image_view_request_email', 'status')) {
                    EmailUtility::email_on_request($notify_user, 'gallery_image_view_request_email');
                }

                // View Profile Picture email SMS to member

                return $this->success_message('gallery image view request sent successfully');
            } else {
                return $this->failure_message('Something went wrong');
            }
        } else {
            return $this->failure_message('Already requested');
        }
    }

    public function accept_image_view_request(Request $request)
    {
        $auth_user = auth()->user();
        $view_gallery_image = ViewGalleryImage::findOrFail($request->gallery_image_view_request_id);
        //   dd($view_gallery_image);
        $view_gallery_image->status = 1;
        $view_gallery_image->save();
        if ($view_gallery_image) {

            $notify_user = User::where('id', $view_gallery_image->requested_by)->first();

            // Express Interest Store Notification for member
            try {
                $notify_type = 'accept_gallery_image_view_request';
                $id = null;
                $notify_by = $auth_user->id;
                $info_id = $view_gallery_image->id;
                $message = $auth_user->first_name.' '.$auth_user->last_name.' '.translate(' has accepted your gallery image view request.');
                $route = route('member_profile', $auth_user->id);

                // fcm
                if (get_setting('firebase_push_notification') == 1) {
                    self::sendFirebaseNotification($notify_user->fcm_token, $notify_user, $notify_type, $message, $notify_by);
                }
                // end of fcm

                Notification::send($notify_user, new DbStoreNotification($notify_type, $id, $notify_by, $info_id, $message, $route));
            } catch (\Exception $e) {
                // dd($e);
            }

            // View Profile Picture email send to member
            if ($notify_user->email != null && get_email_template('gallery_image_view_request_accepted_email', 'status')) {
                EmailUtility::email_on_accept_request($notify_user, 'gallery_image_view_request_accepted_email');
            }

            // View Profile Picture email SMS to member

            return $this->success_message('Interest has been accepted successfully.');
        } else {
            return $this->failure_message('Sorry! Did not find any request.');
        }
    }

    public function reject_image_view_request(Request $request)
    {
        $auth_user = auth()->user();
        $gallery_view_request = ViewGalleryImage::findOrFail($request->gallery_image_view_request_id);

        if (ViewGalleryImage::destroy($request->gallery_image_view_request_id)) {

            $notify_user = User::where('id', $gallery_view_request->requested_by)->first();
            try {
                $notify_type = 'reject_gallery_image_view_request';
                $id = null;
                $notify_by = auth()->id();
                $info_id = $gallery_view_request->id;
                $message = $auth_user->first_name.' '.$auth_user->last_name.' '.translate(' has rejected your gallery image view request.');
                $route = route('member_profile', $auth_user->id);

                // fcm
                if (get_setting('firebase_push_notification') == 1) {
                    self::sendFirebaseNotification($notify_user->fcm_token, $notify_user, $notify_type, $message, $notify_by);
                }
                // end of fcm

                Notification::send($notify_user, new DbStoreNotification($notify_type, $id, $notify_by, $info_id, $message, $route));
            } catch (\Exception $e) {
                // dd($e);
            }

            return $this->success_message('gallery image view request has been rejected successfully.');
        } else {
            return $this->failure_message('Sorry! Something went wrong.');
        }
    }

    public static function sendFirebaseNotification($fcmTokens, $notify_user, $notify_type, $message, $notify_by = null)
    {
        // send firebase notification for mobile app
        if ($notify_user->fcm_token != null) {
            $data = (object) [];
            $data->fcm_token = $notify_user->fcm_token;
            $data->title = $notify_type;
            $data->text = $message;
            $data->notify_by = $notify_by;
            FirbaseNotification::send($data);
        }
        // end of  firebase notification

        Larafirebase::withTitle(str_replace('_', ' ', $notify_type))
            ->withBody($message)
            ->sendMessage($fcmTokens);
    }
}

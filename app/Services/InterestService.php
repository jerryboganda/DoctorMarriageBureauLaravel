<?php

namespace App\Services;

use App\Models\ChatThread;
use App\Models\ExpressInterest;
use App\Models\User;
use App\Notifications\DbStoreNotification;
use App\Utility\EmailUtility;
use App\Utility\SmsUtility;
use Illuminate\Support\Facades\Notification;
use Kutia\Larafirebase\Facades\Larafirebase;

class InterestService
{

      /**
       * Send a proposal (express interest) to another user.
       * Returns ['success' => true] on success, or ['success' => false, 'error_code' => '...', 'message' => '...'] on failure.
       */
      public function store($user_id)
      {
            $interested_by_user = auth()->user();

            // Check if the sender's account is blocked
            if ($interested_by_user->blocked) {
                  return [
                        'success' => false,
                        'error_code' => 'account_blocked',
                        'message' => translate('Your account has been blocked by the administration. Please contact support for assistance.'),
                  ];
            }

            // Check if the sender's account is deactivated
            if ($interested_by_user->deactivated) {
                  return [
                        'success' => false,
                        'error_code' => 'account_deactivated',
                        'message' => translate('Your account is currently deactivated. Please reactivate your account from Settings before sending proposals.'),
                  ];
            }

            $interested_by_member = $interested_by_user->member;

            // Check if the sender has a member profile
            if (!$interested_by_member) {
                  return [
                        'success' => false,
                        'error_code' => 'profile_incomplete',
                        'message' => translate('Please complete your profile before sending proposals.'),
                  ];
            }

            // Check the target user
            $target_user = User::find($user_id);
            if (!$target_user) {
                  return [
                        'success' => false,
                        'error_code' => 'invalid_target',
                        'message' => translate('The profile you are trying to send a proposal to does not exist.'),
                  ];
            }

            if ($target_user->deactivated) {
                  return [
                        'success' => false,
                        'error_code' => 'target_deactivated',
                        'message' => translate('This profile is currently unavailable. The user may have deactivated their account.'),
                  ];
            }

            if ($target_user->blocked) {
                  return [
                        'success' => false,
                        'error_code' => 'target_blocked',
                        'message' => translate('This profile is currently unavailable.'),
                  ];
            }

            // Check proposal quota
            if ($interested_by_member->remaining_interest > 0) {
                  // Store express interest data using mass assignment
                  $express_interest = ExpressInterest::create([
                      'user_id' => $user_id,
                      'interested_by' => $interested_by_user->id,
                      'status' => 0
                  ]);

                  // Deduct interested by user's remaining express interest value
                  $interested_by_member->remaining_interest -= 1;
                  $interested_by_member->save();

                  $notify_user = $target_user;

                  $notify_type = 'express_interest';
                  $notify_by = $interested_by_user->id;
                  $info_id = $express_interest->id;
                  $message = $interested_by_user->first_name . ' ' . $interested_by_user->last_name . ' ' . translate(' has Sent You a Proposal.');
                  $route = route('interest_requests');

                  $this->notifyUser($user_id, $notify_user, $notify_type, $notify_by, $info_id, $message, $route);

                  // Express Interest email send to member
                  if ($notify_user->email != null && get_email_template('email_on_express_interest', 'status')) {
                        EmailUtility::email_on_request($notify_user, 'email_on_express_interest');
                  }

                  // Express Interest Send SMS to member
                  if ($notify_user->phone != null && addon_activation('otp_system') && (get_sms_template('express_interest', 'status') == 1)) {
                        SmsUtility::sms_on_request($notify_user, 'express_interest');
                  }

                  return ['success' => true];
            } else {
                  // Quota exhausted — provide clear feedback
                  $package = \App\Models\Package::find($interested_by_member->current_package_id);
                  $packageName = $package ? $package->name : 'Free';
                  $totalQuota = $package ? $package->express_interest : 0;

                  return [
                        'success' => false,
                        'error_code' => 'quota_exhausted',
                        'message' => translate('You have used all :used out of :total proposals included in your :package package. Please upgrade to a higher package to send more proposals.', [
                              'used' => $totalQuota,
                              'total' => $totalQuota,
                              'package' => $packageName,
                        ]),
                  ];
            }
      }

      public function accept($interest_id)
      {
            $interest = ExpressInterest::find($interest_id);
            if ($interest) {
                  $interest->status = 1;
                  $interest->save();

                  // $existing_chat_thread = ChatThread::where('sender_user_id', $interest->interested_by)->where('receiver_user_id', $interest->user_id)->first();
                  $existing_chat_thread = ChatThread::where(function ($query) use ($interest) {
                        $query->where('sender_user_id', $interest->interested_by)->where('receiver_user_id', $interest->user_id);
                  })->orWhere(function ($query) use ($interest) {
                        $query->where('receiver_user_id', $interest->interested_by)->where('sender_user_id', $interest->user_id);
                  })->first();
                  if ($existing_chat_thread == null) {
                        $chat_thread                    = new ChatThread;
                        $chat_thread->thread_code       = $interest->interested_by . date('Ymd') . $interest->user_id;
                        $chat_thread->sender_user_id    = $interest->interested_by;
                        $chat_thread->receiver_user_id  = $interest->user_id;
                        $chat_thread->save();
                  }

                  $notify_user = User::where('id', $interest->interested_by)->first();

                  $notify_type = 'accept_interest';
                  $notify_by = auth()->user()->id;
                  $info_id = $interest->id;
                  $message = auth()->user()->first_name . ' ' . auth()->user()->last_name . ' ' . translate(' has accepted your proposal.');
                  $route = route('my_interests.index');

                  $this->notifyUser($interest->interested_by, $notify_user, $notify_type, $notify_by, $info_id, $message, $route);
                  // Express Interest email send to member
                  if ($notify_user->email != null && get_email_template('email_on_accepting_interest', 'status')) {
                        EmailUtility::email_on_accept_request($notify_user, 'email_on_accepting_interest');
                  }

                  // Express Interest Send SMS to member
                  if ($notify_user->phone != null && addon_activation('otp_system') && (get_sms_template('accept_interest', 'status') == 1)) {
                        SmsUtility::sms_on_accept_request($notify_user, 'accept_interest');
                  }

                  return true;
            }
            return false;
      }

      public function reject($interest_id)
      {
            $interest = ExpressInterest::find($interest_id);
            if ($interest) {
                  ExpressInterest::destroy($interest_id);

                  $notify_user = User::where('id', $interest->interested_by)->first();

                  $notify_type = 'reject_interest';
                  $notify_by = auth()->user()->id;
                  $info_id = $interest->id;
                  $message = auth()->user()->first_name . ' ' . auth()->user()->last_name . ' ' . translate(' has rejected your proposal.');
                  $route = route('my_interests.index');

                  $this->notifyUser($interest->interested_by, $notify_user, $notify_type, $notify_by, $info_id, $message, $route);

                  return true;
            }
            return false;
      }

      public function notifyUser($user_id, $notify_user, $notify_type, $notify_by, $info_id, $message, $route)
      {
            try {
                  $id = null;

                  // fcm 
                  if (get_setting('firebase_push_notification') == 1) {
                        $fcmTokens = User::where('id', $user_id)->whereNotNull('fcm_token')->pluck('fcm_token')->toArray();
                        Larafirebase::withTitle($notify_type)
                              ->withBody($message)
                              ->sendMessage($fcmTokens);
                  }
                  // end of fcm
                  // send firebase notification for mobile app
                  if ($notify_user->fcm_token != null) {
                        $data = (object)[];
                        $data->fcm_token = $notify_user->fcm_token;
                        $data->title = $notify_type;
                        $data->text = $message;
                        $data->notify_by = $notify_by;
                        FirbaseNotification::send($data);
                  }
                  // end of  firebase notification

                  Notification::send($notify_user, new DbStoreNotification($notify_type, $id, $notify_by, $info_id, $message, $route));
                  return true;
            } catch (\Exception $e) {
                  return false;
            }
      }
}

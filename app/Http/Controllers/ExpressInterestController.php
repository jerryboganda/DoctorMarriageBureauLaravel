<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ChatThread;
use App\Models\ExpressInterest;
use App\Models\User;
use App\Notifications\DbStoreNotification;
use App\Services\FirbaseNotification;
use App\Services\InterestService;
use App\Utility\EmailUtility;
use Auth;
use DB;
use Illuminate\Http\Request;
use Kutia\Larafirebase\Facades\Larafirebase;
use Notification;

class ExpressInterestController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        try {
            // Exclude interests where the target user has been ignored by the logged in user
            $ignoredUserIds = \App\Models\IgnoredUser::where('ignored_by', Auth::user()->id)->pluck('user_id');

            $interestsQuery = \App\Models\ExpressInterest::where('interested_by', Auth::user()->id);

            if ($ignoredUserIds->count() > 0) {
                $interestsQuery->whereNotIn('user_id', $ignoredUserIds);
            }

            $interests = $interestsQuery
                ->with(['user' => function($query) {
                    $query->select('id', 'first_name', 'last_name', 'photo');
                }])
                ->with(['user.member' => function($query) {
                    $query->select('user_id', 'birthday');
                }])
                ->orderBy('id', 'desc')
                ->paginate(10);

            return view('frontend.member.my_interests', compact('interests'));
        } catch (\Exception $e) {
            \Log::error('Error loading Favourites: ' . $e->getMessage());
            
            // Return empty collection if error
            $interests = collect();
            return view('frontend.member.my_interests', compact('interests'));
        }
    }

    public function interest_requests()
    {
        try {
            // Check if user is authenticated
            if (!Auth::check()) {
                \Log::error('User not authenticated for interest requests');
                return redirect()->route('user.login')->with('error', 'Please login to view interest requests.');
            }

            $user = Auth::user();
            
            // Check if user is approved
            if ($user->approved == 0) {
                \Log::error('User not approved for interest requests: ' . $user->id);
                return redirect()->route('member.verification')->with('error', 'Please verify your account to view interest requests.');
            }

            // Check if user is blocked
            if ($user->blocked == 1) {
                \Log::error('User is blocked for interest requests: ' . $user->id);
                return redirect()->route('user.blocked')->with('error', 'Your account is blocked.');
            }

            $interests = ExpressInterest::where('user_id', $user->id)
                ->with(['user' => function($query) {
                    $query->select('id', 'first_name', 'last_name', 'photo');
                }])
                ->with(['user.member' => function($query) {
                    $query->select('user_id', 'birthday');
                }])
                ->latest()
                ->paginate(10);
            
            return view('frontend.member.interest_requests', compact('interests'));
        } catch (\Exception $e) {
            \Log::error('Error loading interest requests: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            // Return empty collection if error
            $interests = collect();
            return view('frontend.member.interest_requests', compact('interests'))->with('error', 'An error occurred while loading interest requests.');
        }
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $targetUserId = $request->id ?? $request->user_id;
        if (!$targetUserId || (int) $targetUserId === (int) Auth::id()) {
            return false;
        }

        $result = (new InterestService())->store($targetUserId);
        if (is_array($result) && ($result['success'] ?? false)) {
            return true;
        }

        if ($request->expectsJson() || $request->ajax()) {
            $payload = is_array($result) ? $result : [];

            return response()->json([
                'result' => false,
                'status' => $payload['status'] ?? null,
                'code' => $payload['code'] ?? null,
                'error_code' => $payload['error_code'] ?? 'unknown',
                'limit_type' => $payload['limit_type'] ?? null,
                'free_limit' => $payload['free_limit'] ?? null,
                'used' => $payload['used'] ?? null,
                'message' => $payload['message'] ?? translate('Could not send proposal. Please try again.'),
            ], $payload['http_status'] ?? 200);
        }

        return false;
    }

    public function accept_interest(Request $request)
    {
        $interest = ExpressInterest::findOrFail($request->interest_id);
        $interest->status = 1;
        if ($interest->save()) {
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

            // Express Interest Store Notification for member
            try {
                $notify_type = 'accept_interest';
                $id = null;
                $notify_by = Auth::user()->id;
                $info_id = $interest->id;
                $message = Auth::user()->first_name . ' ' . Auth::user()->last_name . ' ' . translate(' has accepted your proposal.');
                $route = route('my_interests.index');

                // fcm 
                if (get_setting('firebase_push_notification') == 1) {
                    $fcmTokens = User::where('id', $interest->interested_by)->whereNotNull('fcm_token')->pluck('fcm_token')->toArray();
                    self::sendFirebaseNotification($fcmTokens, $notify_user, $notify_type, $message, $notify_by);
                }
                // end of fcm

                Notification::send($notify_user, new DbStoreNotification($notify_type, $id, $notify_by, $info_id, $message, $route));
            } catch (\Exception $e) {
                // dd($e);
            }

            // Express Interest email send to member
            if ($notify_user->email != null && get_email_template('email_on_accepting_interest', 'status')) {
                EmailUtility::email_on_accept_request($notify_user, 'email_on_accepting_interest');
            }

            // Express Interest Send SMS to member
            flash(translate('Interest has been accepted successfully.'))->success();
            return redirect()->route('interest_requests');
        } else {
            flash(translate('Sorry! Something went wrong.'))->error();
            return back();
        }
    }

    public function reject_interest(Request $request)
    {
        $interest = ExpressInterest::findOrFail($request->interest_id);

        if (ExpressInterest::destroy($request->interest_id)) {

            $notify_user = User::where('id', $interest->interested_by)->first();
            try {
                $notify_type = 'reject_interest';
                $id = null;
                $notify_by = Auth::user()->id;
                $info_id = $interest->id;
                $message = Auth::user()->first_name . ' ' . Auth::user()->last_name . ' ' . translate(' has rejected your proposal.');
                $route = route('my_interests.index');

                // fcm 
                if (get_setting('firebase_push_notification') == 1) {
                    $fcmTokens = User::where('id', $interest->interested_by)->whereNotNull('fcm_token')->pluck('fcm_token')->toArray();
                    self::sendFirebaseNotification($fcmTokens, $notify_user, $notify_type, $message, $notify_by);
                }
                // end of fcm

                Notification::send($notify_user, new DbStoreNotification($notify_type, $id, $notify_by, $info_id, $message, $route));
            } catch (\Exception $e) {
                // dd($e);
            }

            flash(translate('Interest has been rejected successfully.'))->success();
            return redirect()->route('interest_requests');
        } else {
            flash(translate('Sorry! Something went wrong.'))->error();
            return back();
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    public function accept_all_interests()
    {
        try {
            $user = Auth::user();
            $interests = ExpressInterest::where('user_id', $user->id)->where('status', 0)->get();
            
            foreach($interests as $interest) {
                $interest->status = 1;
                $interest->save();
                
                // Create chat thread if doesn't exist
                $existing_chat_thread = ChatThread::where(function ($query) use ($interest) {
                    $query->where('sender_user_id', $interest->interested_by)->where('receiver_user_id', $interest->user_id);
                })->orWhere(function ($query) use ($interest) {
                    $query->where('receiver_user_id', $interest->interested_by)->where('sender_user_id', $interest->user_id);
                })->first();

                if ($existing_chat_thread == null) {
                    $chat_thread = new ChatThread;
                    $chat_thread->thread_code = $interest->interested_by . date('Ymd') . $interest->user_id;
                    $chat_thread->sender_user_id = $interest->interested_by;
                    $chat_thread->receiver_user_id = $interest->user_id;
                    $chat_thread->save();
                }
            }
            
            return 1;
        } catch (\Exception $e) {
            \Log::error('Accept all interests error: ' . $e->getMessage());
            return 0;
        }
    }

    public function reject_all_interests()
    {
        try {
            $user = Auth::user();
            ExpressInterest::where('user_id', $user->id)->where('status', 0)->delete();
            return 1;
        } catch (\Exception $e) {
            \Log::error('Reject all interests error: ' . $e->getMessage());
            return 0;
        }
    }

    public static function sendFirebaseNotification($fcmTokens = null, $notify_user, $notify_type, $message, $notify_by = null)
    {
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

        Larafirebase::withTitle(str_replace("_", " ", $notify_type))
            ->withBody($message)
            ->sendMessage($fcmTokens);
    }
}

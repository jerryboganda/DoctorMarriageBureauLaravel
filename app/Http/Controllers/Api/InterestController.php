<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\ChatThread;
use App\Utility\SmsUtility;
use Illuminate\Http\Request;
use App\Utility\EmailUtility;
use App\Models\ExpressInterest;
use App\Models\IgnoredUser;
use App\Services\InterestService;
use App\Http\Requests\InterestRequest;
use App\Http\Controllers\Api\Controller;
use App\Http\Resources\MyInterestResource;
use App\Notifications\DbStoreNotification;
use Illuminate\Support\Facades\Notification;
use Kutia\Larafirebase\Facades\Larafirebase;
use App\Http\Resources\ExpressInterestResource;

class InterestController extends Controller
{
    public function my_interests()
    {
        $ignoredUserIds = IgnoredUser::where('ignored_by', auth()->user()->id)->pluck('user_id');

        $interestsQuery = ExpressInterest::orderBy('id', 'desc')
            ->where('interested_by', auth()->user()->id);

        if ($ignoredUserIds->count() > 0) {
            $interestsQuery->whereNotIn('express_interests.user_id', $ignoredUserIds);
        }

        $interests = $interestsQuery
            ->join('users', 'express_interests.user_id', '=', 'users.id')
            ->select('express_interests.id')
            ->distinct()
            ->paginate(10);

        return MyInterestResource::collection($interests)->additional([
            'result' => true
        ]);
    }

    public function express_interest(Request $request)
    {
        if (User::find($request->user_id)) {
            if (!ExpressInterest::where(['user_id' => $request->user_id, 'interested_by' => auth()->user()->id])->first() || ExpressInterest::where(['user_id' => auth()->user()->id, 'interested_by' => $request->user_id])->first()) {
                $interest = new InterestService();
                $new_interest = $interest->store($request->user_id);

                return ($new_interest) ?
                    $this->success_message('Proposal Sent Successfully') :
                    $this->failure_message('Something went wrong');
            }
            return $this->failure_message('Proposal already sent');
        }
        return $this->failure_message('Invalid member for proposal request.');
    }

    public function interest_requests()
    {
        $interests = ExpressInterest::where('user_id', auth()->user()->id)->latest()->paginate(10);
        return ExpressInterestResource::collection($interests)->additional([
            'result' => true
        ]);
    }

    public function accept_interest(Request $request)
    {
        $interest = new InterestService();
        $accept_interest = $interest->accept($request->interest_id);

        return ($accept_interest) ?
            $this->success_message('Proposal has been accepted successfully.') :
            $this->failure_message('Something went wrong');
    }

    public function reject_interest(Request $request)
    {
        $interest = new InterestService();
        $reject_interest = $interest->reject($request->interest_id);

        return ($reject_interest) ?
            $this->success_message('Proposal has been rejected successfully.') :
            $this->failure_message('Something went wrong');
    }

    /**
     * Withdraw/Cancel a sent interest
     * Only the user who sent the interest can cancel it
     */
    public function withdraw_interest(Request $request)
    {
        $interest_id = $request->interest_id;
        $interest = ExpressInterest::find($interest_id);
        
        if (!$interest) {
            return $this->failure_message('Proposal request not found.');
        }
        
        // Only the person who sent the interest can withdraw it
        if ($interest->interested_by != auth()->user()->id) {
            return $this->failure_message('You are not authorized to cancel this proposal.');
        }
        
        // Can only withdraw pending interests
        if ($interest->status != 0) {
            return $this->failure_message('Can only cancel pending proposals.');
        }
        
        // Delete the interest
        ExpressInterest::destroy($interest_id);
        
        return $this->success_message('Proposal withdrawn successfully.');
    }
}

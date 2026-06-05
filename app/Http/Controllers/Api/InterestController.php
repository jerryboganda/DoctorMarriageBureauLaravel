<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\ExpressInterestResource;
use App\Http\Resources\MyInterestResource;
use App\Models\ExpressInterest;
use App\Models\IgnoredUser;
use App\Models\User;
use App\Services\InterestService;
use Illuminate\Http\Request;

class InterestController extends Controller
{
    public function my_interests()
    {
        $ignoredUserIds = IgnoredUser::where('ignored_by', auth()->user()->id)->pluck('user_id');

        $interestsQuery = ExpressInterest::query()
            ->with([
                'user.member',
                'user.spiritual_backgrounds.religion',
                'user.addresses.country',
            ])
            ->where('interested_by', auth()->user()->id)
            ->orderByDesc('id');

        if ($ignoredUserIds->count() > 0) {
            $interestsQuery->whereNotIn('user_id', $ignoredUserIds);
        }

        $interests = $interestsQuery->paginate(10);

        return MyInterestResource::collection($interests)->additional([
            'result' => true,
        ]);
    }

    public function express_interest(Request $request)
    {
        $user = auth()->user();

        // Pre-flight checks with clear error messages
        if ($user->blocked) {
            return response()->json([
                'result' => false,
                'error_code' => 'account_blocked',
                'message' => translate('Your account has been blocked by the administration. Please contact support for assistance.'),
            ]);
        }

        if ($user->deactivated) {
            return response()->json([
                'result' => false,
                'error_code' => 'account_deactivated',
                'message' => translate('Your account is currently deactivated. Please reactivate your account from Settings before sending proposals.'),
            ]);
        }

        $targetUser = User::find($request->user_id);
        if (! $targetUser) {
            return response()->json([
                'result' => false,
                'error_code' => 'invalid_target',
                'message' => translate('This profile could not be found. It may have been removed.'),
            ]);
        }

        if ($targetUser->deactivated) {
            return response()->json([
                'result' => false,
                'error_code' => 'target_deactivated',
                'message' => translate('This profile is currently unavailable. The user may have deactivated their account.'),
            ]);
        }

        $authId = $user->id;
        if ((int) $request->user_id === (int) $authId) {
            return response()->json([
                'result' => false,
                'error_code' => 'self_proposal',
                'message' => translate('You cannot send a proposal to yourself.'),
            ]);
        }

        $existingSent = ExpressInterest::query()
            ->where('user_id', $request->user_id)
            ->where('interested_by', $authId)
            ->first();

        if ($existingSent) {
            return response()->json([
                'result' => false,
                'error_code' => 'already_sent',
                'message' => translate('You have already sent a proposal to this person.'),
            ]);
        }

        $receivedInterest = ExpressInterest::query()
            ->where('user_id', $authId)
            ->where('interested_by', $request->user_id)
            ->first();

        if ($receivedInterest) {
            if ((int) $receivedInterest->status === 1) {
                return $this->success_message('Proposal already accepted');
            }

            $interestService = new InterestService;
            $accepted = $interestService->accept($receivedInterest->id);

            return $accepted
                ? $this->success_message('Proposal accepted successfully.')
                : $this->failure_message('Could not accept proposal at this time. Please try again.');
        }

        $interest = new InterestService;
        $result = $interest->store($request->user_id);

        // InterestService now returns an array with structured error info
        if (is_array($result)) {
            if ($result['success']) {
                return $this->success_message('Proposal Sent Successfully');
            }

            return response()->json([
                'result' => false,
                'status' => $result['status'] ?? null,
                'code' => $result['code'] ?? null,
                'error_code' => $result['error_code'] ?? 'unknown',
                'limit_type' => $result['limit_type'] ?? null,
                'free_limit' => $result['free_limit'] ?? null,
                'used' => $result['used'] ?? null,
                'message' => $result['message'] ?? translate('Could not send proposal. Please try again.'),
            ], $result['http_status'] ?? 200);
        }

        // Legacy fallback (should not reach here)
        return $result
            ? $this->success_message('Proposal Sent Successfully')
            : $this->failure_message('Could not send proposal. Please try again.');
    }

    public function interest_requests()
    {
        $interests = ExpressInterest::query()
            ->with([
                'interestedby.member',
                'interestedby.spiritual_backgrounds.religion',
                'interestedby.addresses.country',
            ])
            ->where('user_id', auth()->user()->id)
            ->latest()
            ->paginate(10);

        return ExpressInterestResource::collection($interests)->additional([
            'result' => true,
        ]);
    }

    public function accept_interest(Request $request)
    {
        $interest = new InterestService;
        $accept_interest = $interest->accept($request->interest_id);

        return ($accept_interest) ?
            $this->success_message('Proposal has been accepted successfully.') :
            $this->failure_message('Something went wrong');
    }

    public function reject_interest(Request $request)
    {
        $interest = new InterestService;
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

        if (! $interest) {
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

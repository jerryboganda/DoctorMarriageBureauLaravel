<?php

namespace App\Services;

use App\Models\Member;
use App\Models\User;

class MemberCommunicationLimitService
{
    public const FREE_LIMIT = 5;

    public function isVerified(?User $user): bool
    {
        return $user && (int) $user->approved === 1;
    }

    public function ensureCanSendMessage(?User $user)
    {
        return $this->ensureCanUseUnverifiedQuota($user, 'message');
    }

    public function ensureCanSendProposal(?User $user)
    {
        return $this->ensureCanUseUnverifiedQuota($user, 'proposal');
    }

    public function recordMessageSent(User $user): void
    {
        $this->incrementUnverifiedCounter($user, 'message');
    }

    public function recordProposalSent(User $user): void
    {
        $this->incrementUnverifiedCounter($user, 'proposal');
    }

    public function subscriptionRequiredResponse()
    {
        return response()->json([
            'result' => false,
            'code' => 'SUBSCRIPTION_REQUIRED',
            'message' => 'Messaging is a premium feature. Please subscribe to a premium package.',
        ], 403);
    }

    private function ensureCanUseUnverifiedQuota(?User $user, string $type)
    {
        if (!$user) {
            return response()->json([
                'result' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($this->isVerified($user)) {
            return null;
        }

        $member = $user->member;
        if (!$member) {
            return response()->json([
                'result' => false,
                'error_code' => 'profile_incomplete',
                'message' => translate('Please complete your profile before continuing.'),
            ], 403);
        }

        $used = $this->usedCount($member, $type);
        if ($used < self::FREE_LIMIT) {
            return null;
        }

        return $this->verificationRequiredResponse($type, min($used, self::FREE_LIMIT));
    }

    private function incrementUnverifiedCounter(User $user, string $type): void
    {
        if ($this->isVerified($user) || !$user->member) {
            return;
        }

        $column = $this->counterColumn($type);
        $user->member()->increment($column);
    }

    private function usedCount(Member $member, string $type): int
    {
        $column = $this->counterColumn($type);
        return (int) ($member->{$column} ?? 0);
    }

    private function counterColumn(string $type): string
    {
        return $type === 'proposal' ? 'unverified_proposals_used' : 'unverified_messages_used';
    }

    private function verificationRequiredResponse(string $type, int $used)
    {
        return response()->json([
            'result' => false,
            'status' => 'non_verified',
            'code' => 'VERIFICATION_REQUIRED',
            'error_code' => $type === 'proposal'
                ? 'unverified_proposal_limit_reached'
                : 'unverified_message_limit_reached',
            'limit_type' => $type,
            'free_limit' => self::FREE_LIMIT,
            'used' => $used,
            'message' => translate('Please verify your profile to continue :action.', [
                'action' => $type === 'proposal' ? 'sending proposals' : 'messaging',
            ]),
        ], 403);
    }
}

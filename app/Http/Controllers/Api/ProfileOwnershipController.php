<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Models\Member;
use App\Models\ProfileManager;
use App\Models\OwnershipTransfer;
use App\Models\StepUpAuthToken;
use App\Events\AccountUpdated;

class ProfileOwnershipController extends Controller
{
    /**
     * Get profile ownership status
     */
    public function getOwnershipStatus(Request $request): JsonResponse
    {
        $user = Auth::user();
        $member = $user->member;

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'management_mode' => $member->management_mode ?? 'self',
                'managers' => ProfileManager::getForMember($member->id)
                    ->map(fn($m) => $m->toApiResponse())
                    ->toArray(),
                'pending_transfer' => $this->getPendingTransfer($member),
                'available_modes' => $this->getAvailableModes(),
                'permissions' => ProfileManager::PERMISSIONS,
            ],
        ]);
    }

    /**
     * Get available management modes
     */
    protected function getAvailableModes(): array
    {
        return [
            [
                'id' => 'self',
                'label' => 'Self Managed',
                'description' => 'I handle all proposals',
                'icon' => 'user',
            ],
            [
                'id' => 'family',
                'label' => 'Family Managed',
                'description' => 'Parents manage account',
                'icon' => 'users',
            ],
            [
                'id' => 'matchmaker',
                'label' => 'Matchmaker (Agent)',
                'description' => 'Professional assistance',
                'icon' => 'heart-handshake',
            ],
            [
                'id' => 'dual',
                'label' => 'Dual Control',
                'description' => 'Me + Family approval',
                'icon' => 'shield-check',
            ],
        ];
    }

    /**
     * Get pending transfer for member
     */
    protected function getPendingTransfer(Member $member): ?array
    {
        $transfer = OwnershipTransfer::getPendingForMember($member->id);
        return $transfer?->toApiResponse();
    }

    /**
     * Update management mode
     */
    public function updateManagementMode(Request $request): JsonResponse
    {
        $user = Auth::user();
        $member = $user->member;

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $request->validate([
            'mode' => 'required|in:self,family,matchmaker,dual',
        ]);

        $member->update(['management_mode' => $request->mode]);

        broadcast(new AccountUpdated($user->id, 'management_mode_changed', [
            'mode' => $request->mode,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Management mode updated.',
            'data' => [
                'management_mode' => $request->mode,
            ],
        ]);
    }

    /**
     * Invite a manager
     */
    public function inviteManager(Request $request): JsonResponse
    {
        $user = Auth::user();
        $member = $user->member;

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'type' => 'required|in:family,matchmaker',
            'permissions' => 'sometimes|array',
            'is_primary' => 'sometimes|boolean',
        ]);

        if (!$request->email && !$request->phone) {
            return response()->json([
                'success' => false,
                'message' => 'Either email or phone is required.',
            ], 422);
        }

        $manager = ProfileManager::invite($member->id, $request->all());

        // TODO: Send invitation email/SMS

        broadcast(new AccountUpdated($user->id, 'manager_invited', [
            'manager' => $manager->toApiResponse(),
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Invitation sent successfully.',
            'data' => $manager->toApiResponse(),
        ]);
    }

    /**
     * Accept manager invitation
     */
    public function acceptManagerInvitation(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $user = Auth::user();
        $manager = ProfileManager::acceptInvitation($request->token, $user->id);

        if (!$manager) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired invitation.',
            ], 400);
        }

        // Notify the profile owner
        $member = $manager->member;
        if ($member) {
            broadcast(new AccountUpdated($member->user_id, 'manager_accepted', [
                'manager' => $manager->toApiResponse(),
            ]));
        }

        return response()->json([
            'success' => true,
            'message' => 'Invitation accepted.',
            'data' => $manager->toApiResponse(),
        ]);
    }

    /**
     * Update manager permissions
     */
    public function updateManagerPermissions(Request $request, int $managerId): JsonResponse
    {
        $user = Auth::user();
        $member = $user->member;

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $request->validate([
            'permissions' => 'required|array',
        ]);

        $manager = ProfileManager::where('id', $managerId)
            ->where('member_id', $member->id)
            ->first();

        if (!$manager) {
            return response()->json([
                'success' => false,
                'message' => 'Manager not found.',
            ], 404);
        }

        $manager->updatePermissions($request->permissions);

        broadcast(new AccountUpdated($user->id, 'manager_updated', [
            'manager' => $manager->fresh()->toApiResponse(),
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Permissions updated.',
            'data' => $manager->toApiResponse(),
        ]);
    }

    /**
     * Remove a manager
     */
    public function removeManager(Request $request, int $managerId): JsonResponse
    {
        $user = Auth::user();
        $member = $user->member;

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $manager = ProfileManager::where('id', $managerId)
            ->where('member_id', $member->id)
            ->where('manager_type', '!=', 'owner')
            ->first();

        if (!$manager) {
            return response()->json([
                'success' => false,
                'message' => 'Manager not found or cannot be removed.',
            ], 404);
        }

        $manager->deactivate();

        broadcast(new AccountUpdated($user->id, 'manager_removed', [
            'manager_id' => $managerId,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Manager removed.',
        ]);
    }

    // ==================== OWNERSHIP TRANSFER ====================

    /**
     * Initiate ownership transfer (requires step-up auth)
     */
    public function initiateTransfer(Request $request): JsonResponse
    {
        $user = Auth::user();
        $member = $user->member;

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $request->validate([
            'step_up_token' => 'required|string',
            'to_name' => 'required|string|max:255',
            'to_email' => 'nullable|email|max:255',
            'to_phone' => 'nullable|string|max:20',
            'reason' => 'nullable|string|max:500',
        ]);

        if (!$request->to_email && !$request->to_phone) {
            return response()->json([
                'success' => false,
                'message' => 'Either email or phone of new owner is required.',
            ], 422);
        }

        try {
            $transfer = OwnershipTransfer::initiate(
                $member->id,
                $user->id,
                $request->step_up_token,
                $request->only(['to_name', 'to_email', 'to_phone', 'reason']),
                $request->ip(),
                $request->userAgent()
            );

            // TODO: Send transfer invitation to recipient

            broadcast(new AccountUpdated($user->id, 'transfer_initiated', [
                'transfer' => $transfer->toApiResponse(),
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Ownership transfer initiated. Invitation sent.',
                'data' => $transfer->toApiResponse(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get pending transfer (by token, for recipient)
     */
    public function getTransferByToken(Request $request, string $token): JsonResponse
    {
        $transfer = OwnershipTransfer::getByToken($token);

        if (!$transfer) {
            return response()->json([
                'success' => false,
                'message' => 'Transfer not found or expired.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'from_name' => $transfer->fromUser?->name ?? 'Unknown',
                'to_name' => $transfer->to_name,
                'reason' => $transfer->transfer_reason,
                'expires_at' => $transfer->expires_at->toISOString(),
                'days_remaining' => max(0, now()->diffInDays($transfer->expires_at, false)),
            ],
        ]);
    }

    /**
     * Accept ownership transfer
     */
    public function acceptTransfer(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $user = Auth::user();
        $transfer = OwnershipTransfer::getByToken($request->token);

        if (!$transfer) {
            return response()->json([
                'success' => false,
                'message' => 'Transfer not found or expired.',
            ], 404);
        }

        if (!$transfer->accept($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Could not accept transfer.',
            ], 400);
        }

        // Notify original owner
        broadcast(new AccountUpdated($transfer->from_user_id, 'transfer_accepted', [
            'new_owner_name' => $user->name,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Ownership transferred successfully.',
        ]);
    }

    /**
     * Reject ownership transfer (by recipient)
     */
    public function rejectTransfer(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'reason' => 'nullable|string|max:500',
        ]);

        $transfer = OwnershipTransfer::getByToken($request->token);

        if (!$transfer) {
            return response()->json([
                'success' => false,
                'message' => 'Transfer not found or expired.',
            ], 404);
        }

        $transfer->reject($request->reason);

        // Notify original owner
        broadcast(new AccountUpdated($transfer->from_user_id, 'transfer_rejected', [
            'reason' => $request->reason,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Transfer rejected.',
        ]);
    }

    /**
     * Cancel ownership transfer (by initiator)
     */
    public function cancelTransfer(Request $request): JsonResponse
    {
        $user = Auth::user();
        $member = $user->member;

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $transfer = OwnershipTransfer::where('member_id', $member->id)
            ->where('from_user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$transfer) {
            return response()->json([
                'success' => false,
                'message' => 'No pending transfer found.',
            ], 404);
        }

        $transfer->cancel();

        broadcast(new AccountUpdated($user->id, 'transfer_cancelled', []));

        return response()->json([
            'success' => true,
            'message' => 'Transfer cancelled.',
        ]);
    }
}

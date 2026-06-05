<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ProfileManager extends Model
{
    protected $fillable = [
        'member_id',
        'manager_user_id',
        'manager_email',
        'manager_phone',
        'manager_name',
        'manager_type',
        'permissions',
        'is_primary',
        'is_active',
        'invitation_token',
        'invited_at',
        'accepted_at',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
        'invited_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    const MANAGER_TYPES = ['owner', 'family', 'matchmaker'];

    const PERMISSIONS = [
        'view_profile' => 'View profile details',
        'edit_profile' => 'Edit profile information',
        'view_matches' => 'View matches and proposals',
        'respond_proposals' => 'Respond to proposals',
        'send_proposals' => 'Send new proposals',
        'view_messages' => 'View messages',
        'send_messages' => 'Send messages',
        'manage_photos' => 'Manage photos',
        'view_contact_info' => 'View contact information',
    ];

    const DEFAULT_FAMILY_PERMISSIONS = [
        'view_profile',
        'edit_profile',
        'view_matches',
        'respond_proposals',
        'send_proposals',
    ];

    const DEFAULT_MATCHMAKER_PERMISSIONS = [
        'view_profile',
        'view_matches',
        'send_proposals',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function managerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_user_id');
    }

    /**
     * Get managers for a member
     */
    public static function getForMember(int $memberId): Collection
    {
        return self::where('member_id', $memberId)
            ->where('is_active', true)
            ->with('managerUser')
            ->orderBy('is_primary', 'desc')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Invite a new manager
     */
    public static function invite(int $memberId, array $data): self
    {
        return self::create([
            'member_id' => $memberId,
            'manager_email' => $data['email'] ?? null,
            'manager_phone' => $data['phone'] ?? null,
            'manager_name' => $data['name'],
            'manager_type' => $data['type'] ?? 'family',
            'permissions' => $data['permissions'] ?? self::getDefaultPermissions($data['type'] ?? 'family'),
            'is_primary' => $data['is_primary'] ?? false,
            'is_active' => false, // Until accepted
            'invitation_token' => Str::random(64),
            'invited_at' => now(),
        ]);
    }

    /**
     * Get default permissions for a manager type
     */
    public static function getDefaultPermissions(string $type): array
    {
        return match ($type) {
            'family' => self::DEFAULT_FAMILY_PERMISSIONS,
            'matchmaker' => self::DEFAULT_MATCHMAKER_PERMISSIONS,
            'owner' => array_keys(self::PERMISSIONS),
            default => ['view_profile'],
        };
    }

    /**
     * Accept invitation
     */
    public static function acceptInvitation(string $token, int $userId): ?self
    {
        $manager = self::where('invitation_token', $token)
            ->where('is_active', false)
            ->first();

        if (! $manager) {
            return null;
        }

        $manager->update([
            'manager_user_id' => $userId,
            'is_active' => true,
            'invitation_token' => null,
            'accepted_at' => now(),
        ]);

        return $manager;
    }

    /**
     * Check if manager has permission
     */
    public function hasPermission(string $permission): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $permissions = $this->permissions ?? [];

        return in_array($permission, $permissions);
    }

    /**
     * Update permissions
     */
    public function updatePermissions(array $permissions): void
    {
        // Validate permissions
        $validPermissions = array_intersect($permissions, array_keys(self::PERMISSIONS));
        $this->update(['permissions' => $validPermissions]);
    }

    /**
     * Deactivate manager
     */
    public function deactivate(): void
    {
        $this->update([
            'is_active' => false,
            'is_primary' => false,
        ]);
    }

    /**
     * Set as primary manager
     */
    public function setAsPrimary(): void
    {
        // Remove primary from others
        self::where('member_id', $this->member_id)
            ->where('id', '!=', $this->id)
            ->update(['is_primary' => false]);

        $this->update(['is_primary' => true]);
    }

    /**
     * Format for API response
     */
    public function toApiResponse(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->manager_name ?? $this->managerUser?->name ?? 'Unknown',
            'email' => $this->manager_email,
            'type' => $this->manager_type,
            'permissions' => $this->permissions ?? [],
            'is_primary' => $this->is_primary,
            'is_active' => $this->is_active,
            'is_pending' => ! $this->is_active && $this->invitation_token,
            'invited_at' => $this->invited_at?->toISOString(),
            'accepted_at' => $this->accepted_at?->toISOString(),
        ];
    }
}

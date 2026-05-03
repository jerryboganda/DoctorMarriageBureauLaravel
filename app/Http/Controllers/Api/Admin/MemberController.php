<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Member;
use App\Models\Package;
use App\Models\ReportedUser;
use App\Models\User;
use App\Notifications\DbStoreNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\MembersImport;

class MemberController extends BaseAdminController
{
    public function index(Request $request)
    {
        $query = User::query()
            ->where('user_type', 'member')
            ->with(['member.package']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', '%' . $search . '%')
                    ->orWhere('last_name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('phone', 'like', '%' . $search . '%')
                    ->orWhere('code', 'like', '%' . $search . '%');
            });
        }

        if (($membership = $request->get('membership')) !== null && $membership !== '') {
            $query->where('membership', $membership);
        }
        if (($approved = $request->get('approved')) !== null && $approved !== '') {
            $query->where('approved', $approved);
        }
        if (($blocked = $request->get('blocked')) !== null && $blocked !== '') {
            $query->where('blocked', $blocked);
        }
        if (($deactivated = $request->get('deactivated')) !== null && $deactivated !== '') {
            $query->where('deactivated', $deactivated);
        }

        $query->orderByDesc('id');

        return $this->ok($this->paginateQuery($request, $query));
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'gender' => 'nullable|string',
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'user_type' => 'member',
            'membership' => (int) $request->get('membership', 1),
            'approved' => (int) $request->get('approved', 1),
        ]);

        Member::create([
            'user_id' => $user->id,
            'gender' => $request->gender,
            'birthday' => $request->birthday,
            'on_behalves_id' => $request->on_behalves_id,
        ]);

        return $this->ok($user->load('member'), 'Member created successfully');
    }

    public function show($id)
    {
        $member = User::with([
            'member',
            'addresses.city',
            'education',
            'career',
            'physical_attributes',
            'hobbies',
            'attitude',
            'lifestyles',
            'spiritual_backgrounds',
            'astrologies',
            'families',
            'partner_expectations',
            'gallery_images',
        ])->where('user_type', 'member')->findOrFail($id);

        return $this->ok($member);
    }

    public function update(Request $request, $id)
    {
        $user = User::where('user_type', 'member')->findOrFail($id);

        $user->first_name = $request->get('first_name', $user->first_name);
        $user->last_name = $request->get('last_name', $user->last_name);
        $user->email = $request->get('email', $user->email);
        $user->phone = $request->get('phone', $user->phone);
        if ($request->filled('password')) {
            $user->password = Hash::make((string) $request->password);
        }
        if ($request->has('approved')) {
            $user->approved = (int) $request->approved;
        }
        if ($request->has('membership')) {
            $user->membership = (int) $request->membership;
        }
        if ($request->has('blocked')) {
            $user->blocked = (int) $request->blocked;
        }
        if ($request->has('deactivated')) {
            $user->deactivated = (int) $request->deactivated;
        }
        $user->save();

        $member = $user->member;
        if ($member) {
            foreach ($request->only(['gender', 'birthday', 'on_behalves_id', 'current_package_id']) as $key => $value) {
                $member->{$key} = $value;
            }
            $member->save();
        }

        return $this->ok($user->fresh()->load('member'), 'Member updated successfully');
    }

    public function destroy($id)
    {
        $user = User::where('user_type', 'member')->findOrFail($id);
        $user->delete();

        return $this->ok(null, 'Member deleted successfully');
    }

    public function deleted(Request $request)
    {
        $query = User::onlyTrashed()->where('user_type', 'member');
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', '%' . $search . '%')
                    ->orWhere('last_name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        return $this->ok($this->paginateQuery($request, $query->orderByDesc('deleted_at')));
    }

    public function restore($id)
    {
        $user = User::onlyTrashed()->where('user_type', 'member')->findOrFail($id);
        $user->restore();

        return $this->ok($user->fresh(), 'Member restored successfully');
    }

    public function permanentDelete($id)
    {
        $user = User::onlyTrashed()->where('user_type', 'member')->findOrFail($id);
        $user->forceDelete();

        return $this->ok(null, 'Member permanently deleted');
    }

    public function block(Request $request, $id)
    {
        $user = User::where('user_type', 'member')->findOrFail($id);
        $user->blocked = (int) $request->get('blocked', !$user->blocked);
        if ($request->filled('blocking_reason')) {
            $user->blocking_reason = $request->blocking_reason;
        }
        $user->save();

        return $this->ok($user, 'Member block status updated');
    }

    public function toggleActivation($id)
    {
        $user = User::where('user_type', 'member')->findOrFail($id);
        $user->deactivated = (int) !$user->deactivated;
        $user->save();

        return $this->ok($user, 'Member activation status updated');
    }

    public function setPassword(Request $request, $id)
    {
        $request->validate(['password' => 'required|string|min:6']);

        $user = User::where('user_type', 'member')->findOrFail($id);
        $user->password = Hash::make((string) $request->password);
        $user->must_change_password = 1;
        $user->save();

        return $this->ok(null, 'Password updated successfully');
    }

    public function loginAs($id)
    {
        $user = User::where('user_type', 'member')->findOrFail($id);
        $token = $user->createToken('Admin Login As Member')->plainTextToken;

        return $this->ok([
            'member_id' => $user->id,
            'token' => $token,
            'token_type' => 'Bearer',
        ], 'Login as member token created');
    }

    public function verificationRequests(Request $request)
    {
        $query = User::query()->where('user_type', 'member')->where('approved', 0);
        return $this->ok($this->paginateQuery($request, $query->orderByDesc('id')));
    }

    public function approveVerification($id)
    {
        $user = User::where('user_type', 'member')->findOrFail($id);
        $user->approved = 1;
        $user->save();

        return $this->ok($user, 'Verification approved');
    }

    public function rejectVerification($id)
    {
        $user = User::where('user_type', 'member')->findOrFail($id);
        $user->approved = 0;
        $user->save();

        return $this->ok($user, 'Verification rejected');
    }

    public function unapprovedPictures(Request $request)
    {
        $query = User::query()->where('user_type', 'member')->where('photo_approved', 0);
        return $this->ok($this->paginateQuery($request, $query->orderByDesc('id')));
    }

    public function approvePicture($id)
    {
        $user = User::where('user_type', 'member')->findOrFail($id);
        $user->photo_approved = 1;
        $user->save();

        return $this->ok($user, 'Profile picture approved');
    }

    public function updatePackage(Request $request, $id)
    {
        $request->validate([
            'package_id' => 'required|exists:packages,id',
        ]);

        $user = User::where('user_type', 'member')->findOrFail($id);
        $member = $user->member;
        if (!$member) {
            return $this->fail('Member profile not found', 404);
        }

        $package = Package::findOrFail($request->package_id);
        $member->current_package_id = $package->id;
        $member->save();

        return $this->ok($member->fresh()->load('package'), 'Package updated');
    }

    public function updateWallet(Request $request, $id)
    {
        $user = User::where('user_type', 'member')->findOrFail($id);
        $user->balance = (float) $request->get('balance', $user->balance ?? 0);
        $user->save();

        return $this->ok($user, 'Wallet balance updated');
    }

    public function sendNotification(Request $request, $id)
    {
        $user = User::where('user_type', 'member')->findOrFail($id);
        $title = (string) $request->get('title', 'Admin Notification');
        $message = (string) $request->get('message', '');

        Notification::send(
            $user,
            new DbStoreNotification(
                'admin_notification',
                null,
                optional($request->user())->id,
                $user->id,
                $message,
                null,
                $title
            )
        );

        return $this->ok(null, 'Notification sent');
    }

    public function filterByStatus(Request $request, $status)
    {
        $query = User::query()->where('user_type', 'member');
        switch ($status) {
            case 'free':
                $query->where('membership', 1);
                break;
            case 'premium':
                $query->where('membership', 2);
                break;
            case 'approved':
                $query->where('approved', 1);
                break;
            case 'pending':
                $query->where('approved', 0);
                break;
            case 'deactivated':
                $query->where('deactivated', 1);
                break;
            case 'blocked':
                $query->where('blocked', 1);
                break;
            default:
                break;
        }

        return $this->ok($this->paginateQuery($request, $query->orderByDesc('id')));
    }

    public function reported(Request $request)
    {
        $query = ReportedUser::query()->with(['user', 'reportedBy'])->orderByDesc('id');
        return $this->ok($this->paginateQuery($request, $query));
    }

    public function deleteReported($id)
    {
        $report = ReportedUser::findOrFail($id);
        $report->delete();

        return $this->ok(null, 'Report deleted successfully');
    }

    public function bulkUpload(Request $request)
    {
        $request->validate([
            'bulk_file' => 'required|file|mimes:csv,txt,xlsx,xls',
        ]);

        Excel::import(new MembersImport(), $request->file('bulk_file'));

        return $this->ok(null, 'Members imported successfully');
    }
}

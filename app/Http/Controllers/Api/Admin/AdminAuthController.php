<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    /**
     * Admin login via API (Sanctum token)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)
            ->whereIn('user_type', ['admin', 'staff'])
            ->whereNull('deleted_at')
            ->first();

        if (!$user) {
            return response()->json([
                'result' => false,
                'message' => 'Invalid credentials or you do not have admin access.',
            ], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'result' => false,
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($user->blocked == 1) {
            return response()->json([
                'result' => false,
                'message' => 'Your account has been blocked.',
            ], 403);
        }

        // Create Sanctum token
        $tokenResult = $user->createToken('Admin API Token');
        $token = $tokenResult->plainTextToken;

        // Collect permissions
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();

        return response()->json([
            'result' => true,
            'message' => 'Successfully logged in',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => trim($user->first_name . ' ' . $user->last_name),
                'email' => $user->email,
                'phone' => $user->phone,
                'user_type' => $user->user_type,
                'avatar' => $user->photo ? uploaded_asset($user->photo) : null,
                'permissions' => $permissions,
            ],
        ]);
    }

    /**
     * Get current admin user info + permissions
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user || !in_array($user->user_type, ['admin', 'staff'])) {
            return response()->json([
                'result' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $permissions = $user->getAllPermissions()->pluck('name')->toArray();

        return response()->json([
            'result' => true,
            'user' => [
                'id' => $user->id,
                'name' => trim($user->first_name . ' ' . $user->last_name),
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'user_type' => $user->user_type,
                'avatar' => $user->photo ? uploaded_asset($user->photo) : null,
                'permissions' => $permissions,
            ],
        ]);
    }

    /**
     * Logout (revoke current token)
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'result' => true,
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Update admin profile
     */
    public function updateProfile(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'new_password' => 'nullable|string|min:6|confirmed',
        ]);

        $user = $request->user();
        $user->first_name = $request->first_name;
        $user->last_name = $request->last_name;

        if ($request->filled('new_password')) {
            $user->password = Hash::make($request->new_password);
        }

        $user->save();

        return response()->json([
            'result' => true,
            'message' => 'Profile updated successfully',
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\ExpressInterest;
use App\Models\IgnoredUser;
use App\Services\InterestService;
use Exception;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class WebRouteController extends Controller
{
    public function passwordReset()
    {
        return view('auth.passwords.email');
    }

    public function passwordEmailForm()
    {
        return view('auth.passwords.email');
    }

    public function passwordResetEmailForm()
    {
        return view('auth.passwords.reset');
    }

    public function refreshCsrf()
    {
        return csrf_token();
    }

    public function verificationNotice()
    {
        return response()->json(['message' => 'Please verify your email address.'], 200);
    }

    public function legacyIgnoreUser(Request $request)
    {
        try {
            $user = $request->user();
            $targetUserId = $request->user_id;

            IgnoredUser::create([
                'user_id' => $targetUserId,
                'ignored_by' => $user->id,
            ]);

            return response()->json(['success' => true]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function legacyAcceptInterest(Request $request)
    {
        try {
            if (! auth()->check()) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }

            $user = auth()->user();
            $interestId = $request->interest_id;

            $interest = ExpressInterest::find($interestId);
            if (! $interest) {
                return response()->json(['success' => false, 'message' => 'Proposal request not found'], 404);
            }

            if ($interest->user_id != $user->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            if ((new InterestService)->accept($interestId, $user->id)) {
                return response()->json(['success' => true, 'message' => 'Proposal accepted successfully']);
            }

            return response()->json(['success' => false, 'message' => 'Failed to accept proposal'], 500);
        } catch (Exception $e) {
            Log::error('Error accepting interest: '.$e->getMessage());

            return response()->json(['success' => false, 'message' => 'Internal server error'], 500);
        }
    }

    public function legacyDeclineInterest(Request $request)
    {
        try {
            if (! auth()->check()) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }

            $user = auth()->user();
            $interestId = $request->interest_id;

            $interest = ExpressInterest::find($interestId);
            if (! $interest) {
                return response()->json(['success' => false, 'message' => 'Proposal request not found'], 404);
            }

            if ($interest->user_id != $user->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            if ((new InterestService)->reject($interestId, $user->id)) {
                return response()->json(['success' => true, 'message' => 'Proposal declined successfully']);
            }

            return response()->json(['success' => false, 'message' => 'Failed to decline proposal'], 500);
        } catch (Exception $e) {
            Log::error('Error declining interest: '.$e->getMessage());

            return response()->json(['success' => false, 'message' => 'Internal server error'], 500);
        }
    }

    public function legacyCheckInterestStatus(Request $request, $userId)
    {
        try {
            if (! auth()->check()) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }

            $user = auth()->user();

            $sentInterest = ExpressInterest::where('interested_by', $user->id)
                ->where('user_id', $userId)
                ->first();

            $receivedInterest = ExpressInterest::where('user_id', $user->id)
                ->where('interested_by', $userId)
                ->first();

            $status = 'none';
            $buttonText = 'Send Proposal';
            $buttonClass = 'btn-send-interest';

            if ($sentInterest) {
                if ($sentInterest->status == 1) {
                    $status = 'accepted';
                    $buttonText = 'Proposal Accepted';
                    $buttonClass = 'btn-interest-accepted';
                } else {
                    $status = 'sent';
                    $buttonText = 'Proposal Sent';
                    $buttonClass = 'btn-interest-sent';
                }
            } elseif ($receivedInterest) {
                if ($receivedInterest->status == 1) {
                    $status = 'mutual';
                    $buttonText = 'Mutual Proposal';
                    $buttonClass = 'btn-mutual-interest';
                } else {
                    $status = 'received';
                    $buttonText = 'Reply to Proposal';
                    $buttonClass = 'btn-respond-interest';
                }
            }

            return response()->json([
                'success' => true,
                'status' => $status,
                'button_text' => $buttonText,
                'button_class' => $buttonClass,
            ]);
        } catch (Exception $e) {
            Log::error('Error checking interest status: '.$e->getMessage());

            return response()->json(['success' => false, 'message' => 'Internal server error'], 500);
        }
    }

    public function legacyExpressInterest(Request $request)
    {
        try {
            if (! auth()->check()) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }

            $user = auth()->user();
            $targetUserId = $request->user_id;

            $existingInterest = ExpressInterest::where('user_id', $targetUserId)
                ->where('interested_by', $user->id)
                ->first();

            if ($existingInterest) {
                return response()->json(['success' => false, 'message' => 'Proposal already sent']);
            }

            if ($targetUserId == $user->id) {
                return response()->json(['success' => false, 'message' => 'Cannot send proposal to yourself']);
            }

            $result = (new InterestService)->store($targetUserId);

            if (is_array($result) && ($result['success'] ?? false)) {
                return response()->json(['success' => true, 'message' => 'Proposal sent successfully']);
            }

            $payload = is_array($result) ? $result : [];

            return response()->json([
                'success' => false,
                'result' => false,
                'status' => $payload['status'] ?? null,
                'code' => $payload['code'] ?? null,
                'error_code' => $payload['error_code'] ?? 'unknown',
                'limit_type' => $payload['limit_type'] ?? null,
                'free_limit' => $payload['free_limit'] ?? null,
                'used' => $payload['used'] ?? null,
                'message' => $payload['message'] ?? 'Failed to send proposal',
            ], $payload['http_status'] ?? 200);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function dashboardRedirect()
    {
        return redirect(rtrim(env('FRONTEND_URL', env('APP_URL', 'http://localhost')), '/'));
    }

    public function galleryImageCreateRedirect()
    {
        return redirect()->route('gallery-image.index');
    }

    public function registrationSuccess()
    {
        return view('frontend.registration_success');
    }

    public function runManualMigration()
    {
        try {
            $messages = [];

            if (! Schema::hasColumn('members', 'medical_license_number')) {
                Schema::table('members', function (Blueprint $table) {
                    $table->string('medical_license_number')->nullable()->after('introduction');
                });
                $messages[] = 'Added medical_license_number<br>';
            }
            if (! Schema::hasColumn('members', 'specialization')) {
                Schema::table('members', function (Blueprint $table) {
                    $table->string('specialization')->nullable()->after('medical_license_number');
                });
                $messages[] = 'Added specialization<br>';
            }
            if (! Schema::hasColumn('members', 'verification_document')) {
                Schema::table('members', function (Blueprint $table) {
                    $table->string('verification_document')->nullable()->after('specialization');
                });
                $messages[] = 'Added verification_document<br>';
            }

            return implode('', $messages).'Migration checks completed.';
        } catch (Exception $e) {
            return 'Error: '.$e->getMessage();
        }
    }

    public function adminReact()
    {
        $path = public_path('admin-panel/index.html');
        if (! file_exists($path)) {
            abort(404, 'Admin React build not found. Please run npm run build in Admin Panel Frontend.');
        }

        return response()->file($path);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HappyStory;
use App\Models\PackagePayment;
use App\Models\User;
use App\Utility\EmailUtility;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    /**
     * Dashboard stats and chart data
     */
    public function index(Request $request)
    {
        // Member counts
        $totalMembers = User::where('user_type', 'member')->count();
        $premiumMembers = User::where('user_type', 'member')->where('membership', 2)->count();
        $freeMembers = User::where('user_type', 'member')->where('membership', 1)->count();
        $blockedMembers = User::where('user_type', 'member')->where('blocked', 1)->count();

        // Earnings
        $totalEarnings = PackagePayment::where('payment_status', 'Paid')->sum('amount');
        $lastMonthEarnings = PackagePayment::where('payment_status', 'Paid')
            ->whereBetween('created_at', [Carbon::now()->subMonth(1), Carbon::now()])
            ->sum('amount');
        $last6MonthsEarnings = PackagePayment::where('payment_status', 'Paid')
            ->whereBetween('created_at', [Carbon::now()->subMonth(6), Carbon::now()])
            ->sum('amount');
        $last12MonthsEarnings = PackagePayment::where('payment_status', 'Paid')
            ->whereBetween('created_at', [Carbon::now()->subMonth(12), Carbon::now()])
            ->sum('amount');

        // Monthly earnings for chart (current year)
        $monthlyEarnings = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthlyEarnings[] = (float) PackagePayment::where('payment_status', 'Paid')
                ->whereMonth('created_at', $m)
                ->whereYear('created_at', date('Y'))
                ->sum('amount');
        }

        // Happy stories stats
        $totalHappyStories = HappyStory::count();
        $approvedHappyStories = HappyStory::where('approved', 1)->count();
        $pendingHappyStories = HappyStory::where('approved', 0)->count();

        // Recent happy stories for carousel
        $recentHappyStories = HappyStory::where('approved', 1)
            ->latest()
            ->limit(8)
            ->with('user:id,first_name,last_name')
            ->get()
            ->map(function ($story) {
                $photos = explode(',', $story->photos ?? '');

                return [
                    'id' => $story->id,
                    'title' => $story->title,
                    'couple_name' => ($story->user->first_name ?? '').' & '.($story->partner_name ?? ''),
                    'photo' => ! empty($photos[0]) ? uploaded_asset($photos[0]) : null,
                ];
            });

        // SMTP warning check
        $smtpConfigured = EmailUtility::isConfigured();

        return response()->json([
            'result' => true,
            'data' => [
                'member_stats' => [
                    'total' => $totalMembers,
                    'premium' => $premiumMembers,
                    'free' => $freeMembers,
                    'blocked' => $blockedMembers,
                ],
                'earnings' => [
                    'total' => $totalEarnings,
                    'last_month' => $lastMonthEarnings,
                    'last_6_months' => $last6MonthsEarnings,
                    'last_12_months' => $last12MonthsEarnings,
                    'monthly' => $monthlyEarnings,
                    'currency_symbol' => currency_symbol(),
                ],
                'happy_stories' => [
                    'total' => $totalHappyStories,
                    'approved' => $approvedHappyStories,
                    'pending' => $pendingHappyStories,
                    'recent' => $recentHappyStories,
                ],
                'warnings' => [
                    'smtp_not_configured' => ! $smtpConfigured,
                ],
            ],
        ]);
    }
}

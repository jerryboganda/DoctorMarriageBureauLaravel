<?php

namespace App\Http\Controllers\Api;

use App\Models\ChatThread;
use App\Models\ExpressInterest;
use App\Models\HappyStory;
use App\Models\ProfileMatch;
use App\Models\ProfileViewer;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;

class DashboardWidgetController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();

        $totalViews = ProfileViewer::where('user_id', $user->id)->count();
        $totalLikes = ExpressInterest::where('user_id', $user->id)->count();
        $totalMatches = ProfileMatch::where('user_id', $user->id)->count();

        return response()->json([
            'total_views' => $totalViews,
            'total_likes' => $totalLikes,
            'total_matches' => $totalMatches,
        ]);
    }

    public function incomingInterest(Request $request)
    {
        try {
            $user = $request->user();

            $incomingInterests = ExpressInterest::where('user_id', $user->id)
                ->where('status', 0)
                ->with([
                    'interestedby' => function ($query) {
                        $query->select('id', 'first_name', 'last_name', 'date_of_birth');
                    },
                ])
                ->with([
                    'interestedby.addresses' => function ($query) {
                        $query->select('id', 'user_id', 'city_id')->with('city:id,name');
                    },
                ])
                ->latest()
                ->limit(5)
                ->get()
                ->map(function ($interest) {
                    $interestedUser = $interest->interestedby;
                    if (! $interestedUser) {
                        return null;
                    }
                    $age = $interestedUser->date_of_birth ? Carbon::parse($interestedUser->date_of_birth)->age : '';
                    $location = optional(optional($interestedUser->addresses->first())->city)->name ?? 'N/A';

                    return [
                        'id' => $interestedUser->id,
                        'name' => $interestedUser->first_name.' '.$interestedUser->last_name,
                        'age' => $age,
                        'location' => $location,
                        'interest_id' => $interest->id,
                    ];
                })->filter()->values();

            return response()->json($incomingInterests);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function messagePreview(Request $request)
    {
        $user = $request->user();

        $messagePreviews = ChatThread::where(function ($query) use ($user) {
            $query->where('sender_user_id', $user->id)
                ->orWhere('receiver_user_id', $user->id);
        })
            ->with(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name'])
            ->with([
                'chats' => function ($query) {
                    $query->latest()->limit(1);
                },
            ])
            ->latest()
            ->limit(3)
            ->get()
            ->map(function ($thread) use ($user) {
                $otherUser = $thread->sender_user_id == $user->id ? $thread->receiver : $thread->sender;
                $latestMessage = $thread->chats->first();

                if (! $otherUser) {
                    return null;
                }

                return [
                    'sender_name' => $otherUser->first_name.' '.$otherUser->last_name,
                    'message_preview' => $latestMessage ? substr($latestMessage->message, 0, 50).'...' : 'No messages yet',
                    'time_ago' => $latestMessage ? $latestMessage->created_at->diffForHumans() : 'Just now',
                    'unread_count' => $thread->chats()->where('sender_user_id', '!=', $user->id)->where('seen', 0)->count(),
                    'thread_id' => $thread->id,
                ];
            })->filter();

        return response()->json($messagePreviews);
    }

    public function mutualMatch(Request $request)
    {
        $user = $request->user();

        $mutualMatches = ExpressInterest::where('user_id', $user->id)
            ->where('status', 1)
            ->with([
                'interestedby' => function ($query) {
                    $query->select('id', 'first_name', 'last_name', 'date_of_birth');
                },
            ])
            ->with([
                'interestedby.addresses' => function ($query) {
                    $query->select('id', 'user_id', 'city_id')->with('city:id,name');
                },
            ])
            ->latest()
            ->limit(3)
            ->get()
            ->map(function ($match) {
                $matchedUser = $match->interestedby;
                if (! $matchedUser) {
                    return null;
                }
                $age = $matchedUser->date_of_birth ? Carbon::parse($matchedUser->date_of_birth)->age : null;
                $location = optional(optional($matchedUser->addresses->first())->city)->name ?? 'N/A';

                return [
                    'id' => $matchedUser->id,
                    'name' => $matchedUser->first_name.' '.$matchedUser->last_name,
                    'age' => $age,
                    'location' => $location,
                    'match_percentage' => rand(85, 98),
                    'is_online' => rand(0, 1),
                ];
            })->filter()->values();

        return response()->json($mutualMatches);
    }

    public function recentVisitors(Request $request)
    {
        $user = $request->user();

        $recentVisitors = ProfileViewer::where('user_id', $user->id)
            ->with([
                'profileViewer' => function ($query) {
                    $query->select('id', 'first_name', 'last_name', 'date_of_birth');
                },
            ])
            ->with([
                'profileViewer.addresses' => function ($query) {
                    $query->select('id', 'user_id', 'city_id')->with('city:id,name');
                },
            ])
            ->latest()
            ->limit(3)
            ->get()
            ->map(function ($visitor) {
                if (! $visitor->profileViewer) {
                    return null;
                }

                $age = $visitor->profileViewer->date_of_birth ? Carbon::parse($visitor->profileViewer->date_of_birth)->age : null;
                $location = optional(optional($visitor->profileViewer->addresses->first())->city)->name ?? 'N/A';

                return [
                    'id' => $visitor->profileViewer->id,
                    'name' => $visitor->profileViewer->first_name.' '.$visitor->profileViewer->last_name,
                    'age' => $age,
                    'location' => $location,
                    'visited_time' => $visitor->created_at->diffForHumans(),
                ];
            })->filter();

        return response()->json($recentVisitors);
    }

    public function successStories()
    {
        $successStories = HappyStory::where('approved', 1)
            ->with([
                'user' => function ($query) {
                    $query->select('id', 'first_name', 'last_name');
                },
            ])
            ->latest()
            ->limit(3)
            ->get()
            ->map(function ($story) {
                return [
                    'id' => $story->id,
                    'couple_names' => ($story->user->first_name ?? '').' & '.($story->partner_name ?? 'Partner'),
                    'story_preview' => substr($story->story, 0, 100).'...',
                    'marriage_date' => $story->marriage_date ? Carbon::parse($story->marriage_date)->format('M d, Y') : 'N/A',
                ];
            });

        return response()->json($successStories);
    }

    public function todayMatches(Request $request)
    {
        $user = $request->user();

        $todayMatches = User::where('user_type', 'member')
            ->where('approved', 1)
            ->where('id', '!=', $user->id)
            ->where('blocked', 0)
            ->where('deactivated', 0)
            ->where('permanently_delete', 0)
            ->where('created_at', '>=', now()->subMonth())
            ->with([
                'addresses' => function ($query) {
                    $query->select('id', 'user_id', 'city_id');
                },
                'addresses.city' => function ($query) {
                    $query->select('id', 'name');
                },
            ])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($newUser) {
                $age = $newUser->date_of_birth ? Carbon::parse($newUser->date_of_birth)->age : null;
                $address = $newUser->addresses->first();
                $location = optional(optional($address)->city)->name ?? 'N/A';

                return [
                    'id' => $newUser->id,
                    'name' => $newUser->first_name.' '.$newUser->last_name,
                    'age' => $age,
                    'location' => $location,
                    'joined_time' => $newUser->created_at->diffForHumans(),
                ];
            });

        return response()->json($todayMatches);
    }

    public function acceptInterest(Request $request)
    {
        $user = $request->user();
        $interestId = $request->input('interest_id');

        $interest = ExpressInterest::find($interestId);

        if (! $interest || $interest->user_id != $user->id) {
            return response()->json(['success' => false, 'message' => 'Interest not found'], 404);
        }

        ExpressInterest::create([
            'user_id' => $interest->interested_by,
            'interested_by' => $user->id,
            'status' => 1,
        ]);

        $interest->update(['status' => 1]);

        return response()->json(['success' => true, 'message' => 'Proposal accepted successfully']);
    }

    public function declineInterest(Request $request)
    {
        $user = $request->user();
        $interestId = $request->input('interest_id');

        $interest = ExpressInterest::find($interestId);

        if (! $interest || $interest->user_id != $user->id) {
            return response()->json(['success' => false, 'message' => 'Interest not found'], 404);
        }

        $interest->update(['status' => 2]);

        return response()->json(['success' => true, 'message' => 'Proposal declined successfully']);
    }
}

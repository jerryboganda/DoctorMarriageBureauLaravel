<?php

namespace App\Http\Controllers;

use App\Models\Shortlist;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ShortlistController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        $shortlists = Shortlist::where('shortlisted_by', Auth::user()->id)
            ->WhereNotIn('user_id', function ($query) {
                $query->select('user_id')
                    ->from('ignored_users')
                    ->where('ignored_by', Auth::user()->id)->orWhere('user_id', Auth::user()->id);
            })
            ->WhereNotIn('user_id', function ($query) {
                $query->select('ignored_by')
                    ->from('ignored_users')
                    ->where('ignored_by', Auth::user()->id)->orWhere('user_id', Auth::user()->id);
            })
            ->latest()->paginate(10);

        return view('frontend.member.my_shortlists', compact('shortlists'));
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return Response
     */
    public function create(Request $request)
    {
        $shortlist = Shortlist::firstOrNew([
            'user_id' => $request->id,
            'shortlisted_by' => Auth::user()->id,
        ]);

        if ($shortlist->exists) {
            return 0;
        }

        if ($shortlist->save()) {
            return 1;
        } else {
            return 0;
        }
    }

    public function remove(Request $request)
    {
        $shortlist = Shortlist::where('user_id', $request->id)->where('shortlisted_by', Auth::user()->id)->first()->id;
        if (Shortlist::destroy($shortlist)) {
            return 1;
        } else {
            return 0;
        }
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  int  $id
     * @return Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return Response
     */
    public function destroy() {}
}

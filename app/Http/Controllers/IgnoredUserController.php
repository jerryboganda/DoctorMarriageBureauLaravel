<?php

namespace App\Http\Controllers;

use App\Models\IgnoredUser;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class IgnoredUserController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        $ignored_members = IgnoredUser::where('ignored_by', Auth::user()->id)->latest()->paginate(10);

        return view('frontend.member.my_ignored_members', compact('ignored_members'));
    }

    public function add_to_ignore_list(Request $request)
    {
        $ignore = new IgnoredUser;
        $ignore->user_id = $request->id;
        $ignore->ignored_by = Auth::user()->id;
        if ($ignore->save()) {
            return 1;
        } else {
            return 0;
        }
    }

    public function remove_from_ignored_list(Request $request)
    {
        // echo 'check'; die();
        $ignored_user = IgnoredUser::where('user_id', $request->id)->where('ignored_by', Auth::user()->id)->first()->id;
        if (IgnoredUser::destroy($ignored_user)) {
            return 1;
        } else {
            return 0;
        }
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return Response
     */
    public function create()
    {
        //
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
    public function destroy($id)
    {
        //
    }
}

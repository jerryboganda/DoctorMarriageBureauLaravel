<?php

namespace App\Http\Controllers;

use App\Models\ViewContact;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ViewContactController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        //
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
        $view_contact_by_user = Auth::user();
        $view_contact_by_member = $view_contact_by_user->member;

        if ($view_contact_by_member->remaining_contact_view > 0) {

            // Store view contact data
            $view_contact = new ViewContact;
            $view_contact->user_id = $request->id;
            $view_contact->viewed_by = $view_contact_by_user->id;
            if ($view_contact->save()) {

                // Deduct View Contact by user's remaining contact views
                $view_contact_by_member->remaining_contact_view -= 1;
                $view_contact_by_member->save();

                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
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

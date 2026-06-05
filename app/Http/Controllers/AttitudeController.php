<?php

namespace App\Http\Controllers;

use App\Models\Attitude;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Redirect;
use Validator;

class AttitudeController extends Controller
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
        $this->rules = [
            'affection' => ['max:255'],
            'humor' => ['max:255'],
        ];
        $this->messages = [
            'affection.max' => translate('Max 255 characters'),
            'humor.max' => translate('Max 255 characters'),
        ];

        $rules = $this->rules;
        $messages = $this->messages;
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            flash(translate('Something went wrong'))->error();

            return Redirect::back()->withErrors($validator);
        }

        $attitude = Attitude::where('user_id', $id)->first();
        if (empty($attitude)) {
            $attitude = new Attitude;
            $attitude->user_id = $id;
        }

        $attitude->affection = $request->affection;
        $attitude->humor = $request->humor;
        $attitude->political_views = $request->political_views;
        $attitude->religious_service = $request->religious_service;

        if ($attitude->save()) {
            flash(translate('Personal Attitude and Behavior Info has been updated successfully'))->success();

            return back();
        } else {
            flash(translate('Sorry! Something went wrong.'))->error();

            return back();
        }

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

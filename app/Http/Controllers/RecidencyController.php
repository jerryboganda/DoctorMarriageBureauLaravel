<?php

namespace App\Http\Controllers;

use App\Models\Recidency;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Redirect;
use Validator;

class RecidencyController extends Controller
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
            'immigration_status' => ['max:255'],
        ];
        $this->messages = [
            'immigration_status.max' => translate('Max 255 characters'),
        ];

        $rules = $this->rules;
        $messages = $this->messages;
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            flash(translate('Something went wrong'))->error();

            return Redirect::back()->withErrors($validator);
        }

        $recidencies = Recidency::where('user_id', $id)->first();
        if (empty($recidencies)) {
            $recidencies = new Recidency;
            $recidencies->user_id = $id;
        }

        $recidencies->birth_country_id = $request->birth_country_id;
        $recidencies->recidency_country_id = $request->recidency_country_id;
        $recidencies->growup_country_id = $request->growup_country_id;
        $recidencies->immigration_status = $request->immigration_status;

        if ($recidencies->save()) {
            flash(translate('Residency Info has been updated successfully'))->success();

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

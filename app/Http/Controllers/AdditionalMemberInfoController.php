<?php

namespace App\Http\Controllers;

use App\Models\AdditionalMemberInfo;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AdditionalMemberInfoController extends Controller
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
    public function update(Request $request)
    {
        if ($request->attributes != null) {
            foreach ($request['attributes'] as $attribute) {
                AdditionalMemberInfo::UpdateOrCreate([
                    'user_id' => $request->member_id,
                    'additional_attribute_id' => $attribute,
                ], [
                    'user_id' => $request->member_id,
                    'additional_attribute_id' => $attribute,
                    'value' => $request[$attribute],
                ]);
            }
        }
        flash(get_setting('additional_profile_section_name').' '.translate('Updated successfully.'))->success();

        return back();
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

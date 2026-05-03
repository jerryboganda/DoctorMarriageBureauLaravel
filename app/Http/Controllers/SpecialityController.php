<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Speciality;
use Redirect;
use Validator;

class SpecialityController extends Controller
{
    public function __construct()
    {
        $this->middleware(['permission:show_specialities'])->only('index');
        $this->middleware(['permission:edit_speciality'])->only('edit');
        $this->middleware(['permission:delete_speciality'])->only('destroy');

        $this->rules = [
            'name' => ['required', 'max:255'],
        ];

        $this->messages = [
            'name.required' => translate('Name is required'),
            'name.max'      => translate('Max 255 characters'),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $sort_search  = null;
        $specialities = Speciality::latest();
        if ($request->has('search')) {
            $sort_search  = $request->search;
            $specialities = $specialities->where('name', 'like', '%' . $sort_search . '%');
        }
        $specialities = $specialities->paginate(10);
        return view('admin.member_profile_attributes.specialities.index', compact('specialities', 'sort_search'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $rules     = $this->rules;
        $messages  = $this->messages;
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            flash(translate('Sorry! Something went wrong'))->error();
            return Redirect::back()->withErrors($validator);
        }

        $speciality       = new Speciality;
        $speciality->name = $request->name;
        if ($speciality->save()) {
            flash(translate('New Speciality has been added successfully'))->success();
            return redirect()->route('specialities.index');
        } else {
            flash(translate('Sorry! Something went wrong.'))->error();
            return back();
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $speciality = Speciality::findOrFail(decrypt($id));
        return view('admin.member_profile_attributes.specialities.edit', compact('speciality'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $rules     = $this->rules;
        $messages  = $this->messages;
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            flash(translate('Sorry! Something went wrong'))->error();
            return Redirect::back()->withErrors($validator);
        }

        $speciality       = Speciality::findOrFail($id);
        $speciality->name = $request->name;
        if ($speciality->save()) {
            flash(translate('Speciality has been updated successfully'))->success();
            return redirect()->route('specialities.index');
        } else {
            flash(translate('Sorry! Something went wrong.'))->error();
            return back();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $speciality = Speciality::findOrFail($id);
        $speciality->delete();
        flash(translate('Speciality has been deleted successfully'))->success();
        return redirect()->route('specialities.index');
    }

    /**
     * Bulk delete specialities.
     */
    public function bulk_delete(Request $request)
    {
        if ($request->id) {
            foreach ($request->id as $speciality_id) {
                $this->destroy($speciality_id);
            }
        }
        return 1;
    }
}

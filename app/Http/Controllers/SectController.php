<?php

namespace App\Http\Controllers;

use App\Models\Sect;
use Illuminate\Http\Request;
use Redirect;
use Validator;

class SectController extends Controller
{
    public function __construct()
    {
        $this->middleware(['permission:show_sects'])->only('index');
        $this->middleware(['permission:edit_sect'])->only('edit');
        $this->middleware(['permission:delete_sect'])->only('destroy');

        $this->rules = [
            'name' => ['required', 'max:255'],
        ];

        $this->messages = [
            'name.required' => translate('Name is required'),
            'name.max' => translate('Max 255 characters'),
        ];
    }

    public function index(Request $request)
    {
        $sort_search = null;
        $sects = Sect::orderBy('name', 'asc');

        if ($request->has('search')) {
            $sort_search = $request->search;
            $sects = $sects->where('name', 'like', '%'.$sort_search.'%');
        }

        $sects = $sects->paginate(15);

        return view('admin.member_profile_attributes.sects.index', compact('sects', 'sort_search'));
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), $this->rules, $this->messages);
        if ($validator->fails()) {
            flash(translate('Something went wrong'))->error();

            return Redirect::back()->withErrors($validator);
        }

        $sect = new Sect;
        $sect->name = $request->name;
        $sect->save();

        flash(translate('New Sect has been added successfully'))->success();

        return redirect()->route('sects.index');
    }

    public function edit($id)
    {
        $sect = Sect::findOrFail(decrypt($id));

        return view('admin.member_profile_attributes.sects.edit', compact('sect'));
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), $this->rules, $this->messages);
        if ($validator->fails()) {
            flash(translate('Something went wrong'))->error();

            return Redirect::back()->withErrors($validator);
        }

        $sect = Sect::findOrFail($id);
        $sect->name = $request->name;
        $sect->save();

        flash(translate('Sect has been updated successfully'))->success();

        return redirect()->route('sects.index');
    }

    public function destroy($id)
    {
        $sect = Sect::findOrFail($id);
        $sect->delete();

        flash(translate('Sect has been deleted successfully'))->success();

        return redirect()->route('sects.index');
    }

    public function bulk_destroy(Request $request)
    {
        if ($request->id) {
            foreach ($request->id as $sect_id) {
                $this->destroy($sect_id);
            }
        }

        return 1;
    }
}

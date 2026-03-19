<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\JobTitle;
use Redirect;
use Validator;

class JobTitleController extends Controller
{
    public function __construct()
    {
        $this->middleware(['permission:show_job_titles'])->only('index');
        $this->middleware(['permission:edit_job_title'])->only('edit');
        $this->middleware(['permission:delete_job_title'])->only('destroy');

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
        $sort_search = null;
        $job_titles  = JobTitle::latest();
        if ($request->has('search')) {
            $sort_search = $request->search;
            $job_titles  = $job_titles->where('name', 'like', '%' . $sort_search . '%');
        }
        $job_titles = $job_titles->paginate(10);
        return view('admin.member_profile_attributes.job_titles.index', compact('job_titles', 'sort_search'));
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

        $job_title       = new JobTitle;
        $job_title->name = $request->name;
        if ($job_title->save()) {
            flash(translate('New Job Title has been added successfully'))->success();
            return redirect()->route('job-titles.index');
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
        $job_title = JobTitle::findOrFail(decrypt($id));
        return view('admin.member_profile_attributes.job_titles.edit', compact('job_title'));
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

        $job_title       = JobTitle::findOrFail($id);
        $job_title->name = $request->name;
        if ($job_title->save()) {
            flash(translate('Job Title has been updated successfully'))->success();
            return redirect()->route('job-titles.index');
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
        $job_title = JobTitle::findOrFail($id);
        $job_title->delete();
        flash(translate('Job Title has been deleted successfully'))->success();
        return redirect()->route('job-titles.index');
    }

    /**
     * Bulk delete job titles.
     */
    public function bulk_delete(Request $request)
    {
        if ($request->id) {
            foreach ($request->id as $job_title_id) {
                $this->destroy($job_title_id);
            }
        }
        return 1;
    }
}

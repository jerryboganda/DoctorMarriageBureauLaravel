<?php

namespace App\Http\Controllers;

use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Redirect;
use Validator;

class CountryController extends Controller
{
    protected $country_rules;

    protected $country_messages;

    public function __construct()
    {
        $this->middleware(['permission:show_countries'])->only('index');
        $this->middleware(['permission:edit_country'])->only('updateStatus');

        $this->country_rules = [
            'name' => ['required', 'max:255'],
            'code' => ['required', 'max:2'],
        ];

        $this->country_messages = [
            'name.required' => translate('Country Name is required'),
            'name.max' => translate('Max 255 characters'),
            'code.required' => translate('Country Code is required'),
            'code.max' => translate('Max 2 characters'),
        ];
    }

    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index(Request $request)
    {
        $sort_search = null;
        $countries = Country::orderBy('id', 'asc');

        if ($request->has('search')) {
            $sort_search = $request->search;
            $countries = $countries->where('name', 'like', '%'.$sort_search.'%');
        }
        $countries = $countries->paginate(10);

        return view('admin.member_profile_attributes.countries.index', compact('countries', 'sort_search'));

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
        $rules = $this->country_rules;
        $messages = $this->country_messages;
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            flash(translate('Please fix the validation errors'))->error();

            return Redirect::back()->withErrors($validator)->withInput();
        }

        try {
            $country = new Country;
            $country->name = $request->name;
            $country->code = $request->code;
            $country->save();

            flash(translate('New country has been added successfully'))->success();

            return redirect()->route('countries.index');
        } catch (\Exception $e) {
            \Log::error($e);
            flash(translate('Sorry! Something went wrong.'))->error();

            return back()->withInput();
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
        $country = Country::findOrFail(decrypt($id));

        return view('admin.member_profile_attributes.countries.edit', compact('country'));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  int  $id
     * @return Response
     */
    public function update(Request $request, $id)
    {
        $rules = $this->country_rules;
        $messages = $this->country_messages;
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            flash(translate('Please fix the validation errors'))->error();

            return Redirect::back()->withErrors($validator)->withInput();
        }

        try {
            $country = Country::findOrFail($id);
            $country->name = $request->name;
            $country->code = $request->code;
            $country->save();

            flash(translate('Country info updated successfully.'))->success();

            return redirect()->route('countries.index');
        } catch (\Exception $e) {
            flash(translate('Sorry! Something went wrong.'))->error();

            return back()->withInput();
        }
    }

    public function updateStatus(Request $request)
    {
        $country = Country::findOrFail($request->id);
        $country->status = $request->status;
        if ($country->save()) {
            return 1;
        }

        return 0;
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return Response
     */
    public function destroy($id)
    {
        $country = Country::findOrFail($id);
        foreach ($country->states as $key => $state) {
            foreach ($state->cities as $key => $city) {
                $city->delete();
            }
            $state->delete();
        }
        if (Country::destroy($id)) {
            flash(translate('Country deleted successfully'))->success();

            return redirect()->route('countries.index');
        } else {
            flash(translate('Sorry! Something went wrong.'))->error();

            return back();
        }
    }
}

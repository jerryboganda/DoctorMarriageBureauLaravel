<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ProfileOptionValue;
use Redirect;
use Validator;

class ProfileOptionValueController extends Controller
{
    /**
     * Human-readable labels for each option group.
     */
    public static array $groupLabels = [
        'gender'                 => 'Gender',
        'marriage_timeline'      => 'Marriage Timeline',
        'relocation_willingness' => 'Relocation Willingness',
        'seriousness_level'      => 'Seriousness Level',
        'diet'                   => 'Dietary Preferences',
        'drink'                  => 'Drinking',
        'smoke'                  => 'Smoking',
        'property'               => 'House / Property',
        'living_with'            => 'Living With',
        'sleep_schedule'         => 'Sleep Schedule',
        'work_location_type'     => 'Work Location',
        'family_type'            => 'Family Type',
        'immigration_status'     => 'Immigration Status',
        'personality_tags'       => 'Personality Tags',
        'personal_values'        => 'Personal Values',
        'community_values'       => 'Community Values',
    ];

    public function __construct()
    {
        $this->middleware(['permission:show_profile_option_values'])->only('index');
        $this->middleware(['permission:edit_profile_option_value'])->only('edit');
        $this->middleware(['permission:delete_profile_option_value'])->only('destroy');

        $this->rules = [
            'group' => ['required', 'max:255'],
            'value' => ['required', 'max:255'],
            'label' => ['required', 'max:255'],
        ];

        $this->messages = [
            'group.required' => translate('Group is required'),
            'value.required' => translate('Value is required'),
            'label.required' => translate('Label is required'),
        ];
    }

    /**
     * Display a listing of profile option values, with optional group filter.
     */
    public function index(Request $request)
    {
        $sort_search  = null;
        $active_group = $request->group;

        $query = ProfileOptionValue::query();

        if ($active_group) {
            $query->where('group', $active_group);
        }

        if ($request->has('search') && $request->search != null) {
            $sort_search = $request->search;
            $query->where(function ($q) use ($sort_search) {
                $q->where('label', 'like', '%' . $sort_search . '%')
                  ->orWhere('value', 'like', '%' . $sort_search . '%');
            });
        }

        $query->orderBy('group')->orderBy('sort_order');

        $options     = $query->paginate(25);
        $groupLabels = self::$groupLabels;

        // All distinct groups currently in the database (in case new ones were added)
        $dbGroups = ProfileOptionValue::select('group')
            ->distinct()
            ->orderBy('group')
            ->pluck('group')
            ->toArray();

        // Merge known labels with any unknown groups
        $allGroups = [];
        foreach ($groupLabels as $key => $label) {
            $allGroups[$key] = $label;
        }
        foreach ($dbGroups as $g) {
            if (!isset($allGroups[$g])) {
                $allGroups[$g] = ucwords(str_replace('_', ' ', $g));
            }
        }

        return view('admin.member_profile_attributes.profile_option_values.index', compact(
            'options',
            'sort_search',
            'active_group',
            'allGroups',
            'groupLabels'
        ));
    }

    /**
     * Store a newly created profile option value.
     */
    public function store(Request $request)
    {
        $rules    = $this->rules;
        $messages = $this->messages;
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            flash(translate('Sorry! Something went wrong'))->error();
            return Redirect::back()->withErrors($validator);
        }

        // Check uniqueness within group
        $exists = ProfileOptionValue::where('group', $request->group)
            ->where('value', $request->value)
            ->exists();

        if ($exists) {
            flash(translate('This value already exists in the selected group'))->error();
            return back();
        }

        $option = new ProfileOptionValue;
        $option->group      = $request->group;
        $option->value      = $request->value;
        $option->label      = $request->label;
        $option->sort_order = $request->sort_order ?? ProfileOptionValue::where('group', $request->group)->max('sort_order') + 1;
        $option->is_active  = $request->has('is_active') ? 1 : 0;

        if ($option->save()) {
            flash(translate('New option has been added successfully'))->success();
            return redirect()->route('profile-option-values.index', ['group' => $request->group]);
        } else {
            flash(translate('Sorry! Something went wrong.'))->error();
            return back();
        }
    }

    /**
     * Show the form for editing (loaded via AJAX into modal).
     */
    public function edit($id)
    {
        $option      = ProfileOptionValue::findOrFail(decrypt($id));
        $groupLabels = self::$groupLabels;
        $allGroups   = $groupLabels;

        // Add any unknown groups from DB
        $dbGroups = ProfileOptionValue::select('group')->distinct()->pluck('group')->toArray();
        foreach ($dbGroups as $g) {
            if (!isset($allGroups[$g])) {
                $allGroups[$g] = ucwords(str_replace('_', ' ', $g));
            }
        }

        return view('admin.member_profile_attributes.profile_option_values.edit', compact('option', 'allGroups'));
    }

    /**
     * Update the specified profile option value.
     */
    public function update(Request $request, $id)
    {
        $rules    = $this->rules;
        $messages = $this->messages;
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            flash(translate('Sorry! Something went wrong'))->error();
            return Redirect::back()->withErrors($validator);
        }

        $option = ProfileOptionValue::findOrFail($id);

        // Check uniqueness within group (excluding current record)
        $exists = ProfileOptionValue::where('group', $request->group)
            ->where('value', $request->value)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            flash(translate('This value already exists in the selected group'))->error();
            return back();
        }

        $option->group      = $request->group;
        $option->value      = $request->value;
        $option->label      = $request->label;
        $option->sort_order = $request->sort_order ?? 0;
        $option->is_active  = $request->has('is_active') ? 1 : 0;

        if ($option->save()) {
            flash(translate('Option has been updated successfully'))->success();
            return redirect()->route('profile-option-values.index', ['group' => $option->group]);
        } else {
            flash(translate('Sorry! Something went wrong.'))->error();
            return back();
        }
    }

    /**
     * Toggle active status via AJAX.
     */
    public function toggle_active($id)
    {
        $option = ProfileOptionValue::findOrFail($id);
        $option->is_active = !$option->is_active;
        $option->save();

        return response()->json(['success' => true, 'is_active' => $option->is_active]);
    }

    /**
     * Bulk delete selected records.
     */
    public function bulk_delete(Request $request)
    {
        if ($request->id) {
            foreach ($request->id as $id) {
                $this->destroy($id);
            }
            return 1;
        } else {
            return 0;
        }
    }

    /**
     * Remove the specified profile option value.
     */
    public function destroy($id)
    {
        $option = ProfileOptionValue::findOrFail($id);
        $group  = $option->group;

        if (ProfileOptionValue::destroy($id)) {
            flash(translate('Option has been deleted successfully'))->success();
            return redirect()->route('profile-option-values.index', ['group' => $group]);
        } else {
            flash(translate('Sorry! Something went wrong.'))->error();
            return back();
        }
    }
}

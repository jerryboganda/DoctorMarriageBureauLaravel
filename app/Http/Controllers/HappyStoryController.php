<?php

namespace App\Http\Controllers;

use App\Models\HappyStory;
use Auth;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Redirect;
use Validator;

class HappyStoryController extends Controller
{
    public function __construct()
    {
        $this->middleware(['permission:show_happy_stories'])->only('index');
        $this->middleware(['permission:edit_happy_story'])->only('edit');
        $this->middleware(['permission:view_details_happy_story'])->only('show');

        $this->rules = [
            'title' => ['required', 'max:255'],
            'details' => ['required'],
            'partner_name' => ['required', 'max:255'],
            'photos' => ['required'],
        ];

        $this->messages = [
            'title.required' => translate('Story Title is required'),
            'title.max' => translate('Max 255 characters'),
            'details.required' => translate('Story Details is required'),
            'partner_name.required' => translate('Partner Name is required'),
            'partner_name.max' => translate('Max 100 characters'),

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
        $happy_stories = HappyStory::latest();

        if ($request->has('search')) {
            $sort_search = $request->search;
            // $happy_stories   = $happy_stories->where('name', 'like', '%'.$sort_search.'%');
        }
        $happy_stories = $happy_stories->paginate(18);

        return view('admin.happy_stories.index', compact('happy_stories', 'sort_search'));
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return Response
     */
    public function create()
    {
        return view('frontend.member.happy_story.index');
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return Response
     */
    public function store(Request $request)
    {
        $rules = $this->rules;
        $messages = $this->messages;
        $validator = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            flash(translate('Sorry! Something went wrong'))->error();

            return Redirect::back()->withErrors($validator);
        }

        $story = new HappyStory;
        $story->user_id = Auth::user()->id;
        $story->title = $request->title;
        $story->details = $request->details;
        $story->partner_name = $request->partner_name;
        $story->photos = $request->photos;
        $story->video_provider = $request->video_provider;
        $story->video_link = $request->video_link;
        if ($story->save()) {
            flash(translate('Story uploaded successfully'))->success();

            return redirect()->route('happy_story.member');
        } else {
            flash(translate('Sorry! Something went wrong.'))->error();

            return back();
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
        $happy_story = HappyStory::findOrFail(decrypt($id));

        return view('admin.happy_stories.view', compact('happy_story'));
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return Response
     */
    public function edit($id)
    {
        $happy_story = HappyStory::findOrFail(decrypt($id));

        return view('admin.happy_stories.edit', compact('happy_story'));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  int  $id
     * @return Response
     */
    public function update(Request $request, $id)
    {
        $rules = $this->rules;
        $messages = $this->messages;
        $validator = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            flash(translate('Sorry! Something went wrong'))->error();

            return Redirect::back()->withErrors($validator);
        }

        $story = HappyStory::findOrFail($id);
        $story->title = $request->title;
        $story->details = $request->details;
        $story->partner_name = $request->partner_name;
        $story->photos = $request->photos;
        $story->video_provider = $request->video_provider;
        $story->video_link = $request->video_link;
        if ($story->save()) {
            flash(translate('Story updated successfully'))->success();

            return back();
        } else {
            flash(translate('Sorry! Something went wrong.'))->error();

            return back();
        }
    }

    public function approval_status(Request $request)
    {
        $happy_story = HappyStory::findOrFail($request->id);
        $happy_story->approved = $request->status;
        if ($happy_story->save()) {
            return 1;
        }

        return 0;
    }

    /**
     * Display story details for frontend
     *
     * @param  int  $id
     * @return Response
     */
    public function story_details($id)
    {
        try {
            $happy_story = HappyStory::with('user')->findOrFail($id);

            // Check if story is approved or user owns it
            if ($happy_story->approved != 1) {
                // If not approved, only allow owner to view
                if (Auth::check() && $happy_story->user_id == Auth::user()->id) {
                    // Owner can view their own story even if not approved
                } else {
                    // Not approved and not owner - show 404
                    abort(404, 'Story not found or not approved');
                }
            }

            return view('frontend.happy_stories.story_details', compact('happy_story'));
        } catch (ModelNotFoundException $e) {
            abort(404, 'Story not found');
        } catch (\Exception $e) {
            \Log::error('Error loading story details: '.$e->getMessage());
            abort(500, 'An error occurred while loading the story');
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

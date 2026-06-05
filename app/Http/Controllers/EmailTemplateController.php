<?php

namespace App\Http\Controllers;

use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Redirect;
use Validator;

class EmailTemplateController extends Controller
{
    private $rules = [];

    private $messages = [];

    public function __construct()
    {
        $this->middleware(['permission:email_templates'])->only('index');

        $this->rules = [
            'subject' => ['required', 'max:255'],
            'body' => ['required'],
        ];

        $this->messages = [
            'subject.required' => translate('Email subject is required'),
            'subject.max' => translate('Max 255 characters'),
            'body.required' => translate('Email Body is required'),
        ];
    }

    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        $email_templates = EmailTemplate::all();

        return view('admin.settings.email_templates.index', compact('email_templates'));
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
        $rules = $this->rules;
        $messages = $this->messages;
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            flash(translate('Something went wrong'))->error();

            return Redirect::back()->withErrors($validator);
        }

        $email_template = EmailTemplate::where('identifier', $request->identifier)->first();
        $email_template->subject = $request->subject;
        $email_template->body = $request->body;
        if ($request->status == 1) {
            $email_template->status = 1;
        } else {
            $email_template->status = 0;
        }

        if ($email_template->save()) {
            flash(translate('Email Template has been updated successfully'))->success();

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

<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactUsRequest;
use App\Models\ContactUs;
use App\Models\User;
use App\Notifications\EmailNotification;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Notification;

class ContactUsController extends Controller
{
    /**
     * Spatie Permission
     */
    public function __construct()
    {
        $this->middleware(['permission:show_contact_us_queries'])->only('index');
        $this->middleware(['permission:view_contact_us_query'])->only('show');
        $this->middleware(['permission:update_contact_us_query'])->only('update');
        $this->middleware(['permission:delete_contact_us_query'])->only('destroy');
    }

    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        $contact_us_queries = ContactUs::latest()->paginate(10);

        return view('admin.contact_us.index', compact('contact_us_queries'));
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
     * @param  Request  $request
     * @return Response
     */
    public function store(ContactUsRequest $request)
    {
        ContactUs::create($request->except('g-recaptcha-response'));
        $user = User::where('user_type', 'admin')->first();
        Notification::send($user, new EmailNotification($request->subject, $request->description));
        flash(translate('Your query has been sent successfully'))->success();

        return back();
    }

    /**
     * Display the specified resource.
     *
     * @return Response
     */
    public function show(ContactUs $contactUs, $id)
    {
        $contactUs = ContactUs::findOrFail($id);

        return view('admin.contact_us.view', compact('contactUs'));
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @return Response
     */
    public function edit(ContactUs $contactUs)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  Request  $request
     * @param  ContactUs  $contactUs
     * @return Response
     */
    public function update(ContactUsRequest $request, $id)
    {
        $contactUs = ContactUs::find($id);
        $contactUs->update($request->validated());

        Notification::route('mail', $contactUs->email)->notify(new EmailNotification($contactUs->subject, $contactUs->reply));
        flash(translate('Reply has been sent successfully!'))->success();

        return redirect()->route('contact-us.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return Response
     */
    public function destroy(ContactUs $contactUs, $id)
    {
        $contactUs = ContactUs::findOrFail($id);
        $contactUs->delete();
        flash(translate('Data deleted successfully!'))->success();

        return back();
    }

    /**
     * Display Contact us page
     */
    public function show_contact_us_page()
    {
        return view('frontend.contact_us');
    }
}

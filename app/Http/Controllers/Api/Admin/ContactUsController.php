<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\ContactUs;

class ContactUsController extends CrudController
{
    protected string $modelClass = ContactUs::class;

    protected array $searchColumns = ['name', 'email', 'subject', 'message'];

    protected array $sortable = ['id', 'name', 'email', 'created_at'];
}

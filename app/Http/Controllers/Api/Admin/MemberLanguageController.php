<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\MemberLanguage;

class MemberLanguageController extends CrudController
{
    protected string $modelClass = MemberLanguage::class;
    protected array $searchColumns = ['name'];
    protected array $sortable = ['id', 'name', 'created_at'];
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\ManualPaymentMethod;

class ManualPaymentMethodController extends CrudController
{
    protected string $modelClass = ManualPaymentMethod::class;

    protected array $searchColumns = ['heading', 'description'];

    protected array $sortable = ['id', 'heading', 'created_at'];
}

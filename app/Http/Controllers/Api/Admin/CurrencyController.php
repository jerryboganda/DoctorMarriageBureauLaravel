<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Currency;

class CurrencyController extends CrudController
{
    protected string $modelClass = Currency::class;

    protected array $searchColumns = ['name', 'code', 'symbol'];

    protected array $sortable = ['id', 'name', 'code', 'exchange_rate', 'status', 'created_at'];

    public function toggleStatus($id)
    {
        $currency = Currency::findOrFail($id);
        $currency->status = (int) ! $currency->status;
        $currency->save();

        return $this->ok($currency, 'Currency status updated');
    }
}

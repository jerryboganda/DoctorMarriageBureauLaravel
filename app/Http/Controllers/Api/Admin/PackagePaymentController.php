<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\PackagePayment;

class PackagePaymentController extends BaseAdminController
{
    public function index()
    {
        $query = PackagePayment::query()->with(['user', 'package'])->orderByDesc('id');
        return $this->ok($this->paginateQuery(request(), $query));
    }

    public function show($id)
    {
        $payment = PackagePayment::with(['user', 'package'])->findOrFail($id);
        return $this->ok($payment);
    }

    public function acceptManual($id)
    {
        $payment = PackagePayment::findOrFail($id);
        $payment->payment_status = 'Paid';
        $payment->save();

        return $this->ok($payment, 'Payment accepted');
    }

    public function invoice($id)
    {
        $payment = PackagePayment::with(['user', 'package'])->findOrFail($id);
        return $this->ok([
            'payment' => $payment,
            'currency_symbol' => currency_symbol(),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\PackagePayment;
use App\Models\Transaction;

class WalletController extends BaseAdminController
{
    public function transactions()
    {
        $query = Transaction::query()->orderByDesc('id');
        return $this->ok($this->paginateQuery(request(), $query));
    }

    public function manualRequests()
    {
        $query = PackagePayment::query()
            ->with(['user', 'package'])
            ->where('payment_method', 'manual_payment')
            ->where('payment_status', '!=', 'Paid')
            ->orderByDesc('id');

        return $this->ok($this->paginateQuery(request(), $query));
    }

    public function paymentDetail($id)
    {
        $payment = PackagePayment::with(['user', 'package'])->findOrFail($id);
        return $this->ok($payment);
    }

    public function acceptManual($id)
    {
        $payment = PackagePayment::findOrFail($id);
        $payment->payment_status = 'Paid';
        $payment->save();

        return $this->ok($payment, 'Wallet payment accepted');
    }
}

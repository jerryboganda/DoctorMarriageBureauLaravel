<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AddonPurchaseResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'addon_purchase_id' => $this->id,
            'payment_code' => $this->payment_code,
            'addon_name' => $this->addon ? $this->addon->name : null,
            'payment_method' => $this->payment_method == 'manual_payment' ? $this->custom_payment_name : ucwords($this->payment_method),
            'amount' => single_price($this->amount),
            'payment_status' => $this->payment_status == 'Paid' ? 'Paid' : 'Unpaid',
            'date' => date('d-m-Y h:i:s', strtotime($this->created_at)),
        ];
    }
}

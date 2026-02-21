<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class PartnerExpectationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'general'                   => ['required'],
            'partner_height'                    => ['required', 'numeric', 'between:0,9.99'],
            'partner_weight'                    => ['required', 'numeric', 'between:0,999.99'],
            'partner_marital_status'         => ['required'],
            'partner_children_acceptable'       => ['required', 'max:20'],
            'residence_country_id'      => ['required'],
            'partner_religion_id'               => ['required'],
            'smoking_acceptable'        => ['required', 'max:20'],
            'drinking_acceptable'       => ['required', 'max:20'],
            'partner_diet'                      => ['required', 'max:50'],
            'partner_manglik'                   => ['required', 'max:50'],
            'language_id'               => ['required'],
            'partner_country_id'      => ['required'],
            'partner_state_id'        => ['required'],
            'pertner_complexion'                => ['required', 'max:50'],
        ];
    }

    // public function failedValidation(Validator $validator)
    // {
    //     // dd($this->expectsJson());
    //     if ($this->expectsJson()) {
    //         throw new HttpResponseException(response()->json([
    //             'message' => $validator->errors()->all(),
    //             'result' => false
    //         ], 422));
    //     } else {
    //         throw (new ValidationException($validator))
    //             ->errorBag($this->errorBag)
    //             ->redirectTo($this->getRedirectUrl());
    //     }
    // }
}

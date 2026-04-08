<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Rules\RecaptchaRule;
use App\Utility\PhoneUtility;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Exceptions\HttpResponseException;


class AuthRequest extends FormRequest
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
     * @return array
     */
    public function rules()
    {
        $userId = auth()->id();

        return [
            'first_name'           => 'required|string|max:255',
            'last_name'            => 'required|string|max:255',
            'phone'                => [
                'required',
                'string',
                Rule::unique('users')->ignore($userId)->whereNull('deleted_at')
            ],
            'email'                => [
                'required',
                'email',
                Rule::unique('users')->ignore($userId)->whereNull('deleted_at')
            ],
            'gender'               => 'required',
            'on_behalf'            => 'required|integer',
            'date_of_birth'        => 'required|date',
            'password'             => 'required|string|min:8|confirmed',
            'referral_code'        => 'sometimes',
            'g-recaptcha-response' => [Rule::when(get_setting('google_recaptcha_activation') == 1, ['required', new RecaptchaRule()], ['sometimes'])]
        ];
    }

    /**
     * Get the validation messages of rules that apply to the request.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'gender.required' => translate('gender is required'),
            'on_behalf.required' => translate('on_behalf is required'),
            'on_behalf.integer' => translate('on_behalf should be integer value'),
            'date_of_birth.required' => translate('date_of_birth is required'),
            'date_of_birth.date' => translate('date_of_birth should be in date format'),
            'first_name.required' => translate('first_name is required'),
            'last_name.required' => translate('last_name is required'),
            'email.required' => translate('Email is required'),
            'email.email' => translate('Email must be a valid email address'),
            'email.unique' => translate('This email address is already registered'),
            'phone.unique' => translate('This phone number is already registered'),
            'phone.required' => translate('Phone is required'),
            'password.required' => translate('Password is required'),
            'password.confirmed' => translate('Password confirmation does not match'),
            'password.min' => translate('Minimum 8 characters required for password'),
        ];
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'phone' => PhoneUtility::normalize($this->phone),
            'on_behalves_id'  => $this->on_behalf,
            'birthday'  => date('Y-m-d', strtotime($this->date_of_birth)),
            'membership'  => 1,
            'gender' => ($this->gender == 'Female') ? 2 : 1,
        ]);
    }
    /**
     * Get the error messages for the defined validation rules.*
     * @return array
     */

    public function failedValidation(Validator $validator)
    {
        // dd($this->expectsJson());
        if ($this->expectsJson()) {
            throw new HttpResponseException(response()->json([
                'message' => $validator->errors()->all(),
                'result' => false
            ], 422));
        } else {
            throw (new ValidationException($validator))
                ->errorBag($this->errorBag)
                ->redirectTo($this->getRedirectUrl());
        }
    }
}

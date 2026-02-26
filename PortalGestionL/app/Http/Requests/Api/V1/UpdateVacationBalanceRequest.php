<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVacationBalanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Solo RRHH o Admin pueden modificar los saldos manualmente
        return $this->user()->hasRole(['admin', 'hr_director']);
    }

    public function rules(): array
    {
        return [
            'accrued_days' => 'sometimes|integer|min:0',
            'taken_days' => 'sometimes|integer|min:0',
            'carried_over_days' => 'sometimes|integer|min:0',
            'expires_at' => 'nullable|date',
        ];
    }
}
<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreVacationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Cualquier usuario autenticado puede solicitar vacaciones
        return true; 
    }

    public function rules(): array
    {
        return [
            // La fecha de inicio debe ser hoy o en el futuro
            'start_date' => 'required|date|after_or_equal:today',
            // La fecha de fin debe ser igual o posterior a la de inicio
            'end_date' => 'required|date|after_or_equal:start_date',
            'note' => 'nullable|string|max:500',
        ];
    }

    public function messages()
    {
        return [
            'end_date.after_or_equal' => 'La fecha de fin no puede ser anterior a la fecha de inicio.',
            'start_date.after_or_equal' => 'Las vacaciones deben solicitarse para fechas futuras.',
        ];
    }
}
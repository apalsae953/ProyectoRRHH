<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreHolidayDateRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Solo RRHH y Admin configuran el calendario laboral
        return $this->user()->hasRole(['admin', 'hr_director']);
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date|unique:holiday_dates,date', // No duplicar el mismo festivo
            'scope' => 'required|in:national,center,custom',
            'center_id' => 'nullable|integer',
            'description' => 'nullable|string|max:255',
        ];
    }
    
    public function messages()
    {
        return [
            'date.unique' => 'Ya existe un festivo registrado en esta fecha.',
        ];
    }
}
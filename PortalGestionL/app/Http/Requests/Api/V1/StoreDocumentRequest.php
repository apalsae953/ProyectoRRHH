<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Solo RRHH o Admin pueden subir documentos a los empleados
        return $this->user()->hasRole(['admin', 'hr_director']);
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:pdf|max:5120',
            'type' => 'required|in:payroll,contract,certificate,other',
            'title' => 'required|string|max:255',
            'period_year' => 'nullable|integer|min:2000|max:' . (date('Y') + 1),
            'period_month' => 'nullable|integer|min:1|max:12',
            'visibility' => 'required|in:owner,hr',
        ];
    }
}
<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidDni implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value) || !is_string($value)) {
            $fail('El campo :attribute no es válido.');
            return;
        }

        $dniNie = strtoupper(str_replace(['-', ' '], '', $value));

        if (!preg_match('/^[XYZ]?\d{5,8}[A-Z]$/', $dniNie)) {
            $fail('El campo :attribute no tiene el formato de DNI/NIE correcto.');
            return;
        }

        $numero = str_replace(['X', 'Y', 'Z'], ['0', '1', '2'], substr($dniNie, 0, -1));
        $letra  = substr($dniNie, -1);
        $numero = str_pad($numero, 8, '0', STR_PAD_LEFT);
        $letras = 'TRWAGMYFPDXBNJZSQVHLCKE';

        if (!is_numeric($numero) || $letra !== substr($letras, (int)$numero % 23, 1)) {
            $fail('La letra del campo :attribute no es correcta.');
        }
    }
}

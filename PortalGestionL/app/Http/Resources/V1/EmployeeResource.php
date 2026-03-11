<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->name,
            'apellidos' => $this->surname,
            'email' => $this->email,
            'photo' => $this->photo,
            'dni' => ($request->user() && ($request->user()->hasRole(['admin', 'hr_director']) || $request->user()->id === $this->id))
                ? $this->dni 
                : ($this->dni ? '***' . substr($this->dni, -5) : null),
            'telefono' => $this->phone,
            'direccion' => $this->address,
            'puesto' => $this->whenLoaded('position', function () {
                return $this->position ? [
                    'id' => $this->position->id,
                    'nombre' => $this->position->name,
                ] : null;
            }),
            'estado' => $this->status,
            'fecha_contratacion' => $this->hired_at ? $this->hired_at->format('Y-m-d') : null,
            'fecha_fin_prueba' => $this->probation_until ? $this->probation_until->format('Y-m-d') : null,
            // Si el departamento está cargado en la consulta, lo devolvemos
            'departamento' => $this->whenLoaded('department', function () {
                return $this->department ? [
                    'id' => $this->department->id,
                    'nombre' => $this->department->name,
                ] : null;
            }),
            // Devolvemos los roles si usamos Spatie
            'roles' => $this->getRoleNames(),
            'has_2fa_active' => !empty($this->two_factor_secret),
        ];
    }
}

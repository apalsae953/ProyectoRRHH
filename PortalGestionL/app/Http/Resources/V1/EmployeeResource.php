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
            'dni' => $this->dni,
            'telefono' => $this->phone,
            'puesto' => $this->whenLoaded('position', function () {
                return [
                    'id' => $this->position->id,
                    'nombre' => $this->position->name,
                ];
            }),
            'estado' => $this->status,
            'fecha_contratacion' => $this->hired_at ? $this->hired_at->format('Y-m-d') : null,
            // Si el departamento está cargado en la consulta, lo devolvemos
            'departamento' => $this->whenLoaded('department', function () {
                return [
                    'id' => $this->department->id,
                    'nombre' => $this->department->name,
                ];
            }),
            // Devolvemos los roles si usamos Spatie
            'roles' => $this->getRoleNames(),
        ];
    }
}

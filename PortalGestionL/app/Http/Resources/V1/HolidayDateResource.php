<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HolidayDateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date->format('Y-m-d'),
            'fecha' => $this->date->format('Y-m-d'), // Compatibilidad
            'scope' => $this->scope,
            'center_id' => $this->center_id,
            'description' => $this->description,
            'name' => $this->description, // Compatibilidad con lo que enviaba antes
        ];
    }
}
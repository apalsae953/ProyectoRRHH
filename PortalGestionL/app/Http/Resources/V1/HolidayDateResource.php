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
            'fecha' => $this->date->format('Y-m-d'),
            'ambito' => $this->scope, // national, center, custom
            'centro_id' => $this->center_id, // Nulo si es nacional
            'descripcion' => $this->description,
        ];
    }
}
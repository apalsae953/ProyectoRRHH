<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\HolidayDate;
use Illuminate\Http\Request;
use App\Http\Resources\V1\HolidayDateResource;
use App\Http\Requests\Api\V1\StoreHolidayDateRequest;

class HolidayDateController extends Controller
{
    public function index(Request $request)
    {
        // Ordenamos los festivos cronológicamente
        $holidays = HolidayDate::orderBy('date', 'asc')->get();
        
        return HolidayDateResource::collection($holidays);
    }

    public function store(StoreHolidayDateRequest $request)
    {
        $holiday = HolidayDate::create($request->validated());
        
        return new HolidayDateResource($holiday);
    }

    public function destroy(Request $request, HolidayDate $holiday)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado. Solo RRHH puede borrar festivos.'], 403);
        }

        $holiday->delete();

        return response()->json(['message' => 'Día festivo eliminado del calendario correctamente.']);
    }
}
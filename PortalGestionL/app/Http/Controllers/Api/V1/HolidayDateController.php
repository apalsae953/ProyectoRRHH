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
        $startDate = \Carbon\Carbon::parse($request->date);
        $endDate = $request->date_end ? \Carbon\Carbon::parse($request->date_end) : $startDate;
        
        $createdHolidays = [];
        
        $currentDate = $startDate->copy();
        while ($currentDate <= $endDate) {
            // Solo creamos si no existe ya un festivo ese día
            $exists = HolidayDate::where('date', $currentDate->format('Y-m-d'))->exists();
            
            if (!$exists) {
                $holiday = HolidayDate::create([
                    'date' => $currentDate->format('Y-m-d'),
                    'scope' => $request->scope,
                    'center_id' => $request->center_id,
                    'description' => $request->description,
                ]);
                $createdHolidays[] = $holiday;
            }
            
            $currentDate->addDay();
        }
        
        // Retornamos el último creado o una colección
        return HolidayDateResource::collection($createdHolidays);
    }

    public function destroy(Request $request, HolidayDate $holiday)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado. Solo RRHH puede borrar festivos.'], 403);
        }

        $holiday->delete();

        return response()->json(['message' => 'Día festivo eliminado del calendario correctamente.']);
    }

    public function bulkDestroy(Request $request)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $ids = $request->input('ids', []);
        
        if (empty($ids)) {
            return response()->json(['message' => 'No hay IDs seleccionados.'], 422);
        }

        HolidayDate::whereIn('id', $ids)->delete();

        return response()->json(['message' => count($ids) . ' festivos eliminados correctamente.']);
    }
}
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class LogController extends Controller
{
    /**
     * GET /api/v1/logs
     * Acceso a logs/auditoría (Solo Admin)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('admin')) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $query = Activity::with(['causer']);

        // Búsqueda Ultra-Flexible
        if ($request->has('search')) {
            $search = strtolower($request->search);
            
            // Función para quitar acentos y facilitar la búsqueda
            $normalize = function($term) {
                $term = mb_strtolower($term, 'UTF-8');
                return strtr($term, [
                    'á'=>'a', 'é'=>'e', 'í'=>'i', 'ó'=>'o', 'ú'=>'u',
                    'à'=>'a', 'è'=>'e', 'ì'=>'i', 'ò'=>'o', 'ù'=>'u',
                    'ñ'=>'n'
                ]);
            };

            $searchNorm = $normalize($search);

            $query->where(function($q) use ($search, $searchNorm, $normalize) {
                // 1. Datos básicos
                $q->where('description', 'like', "%$search%")
                  ->orWhere('event', 'like', "%$search%")
                  ->orWhere('subject_id', 'like', "%$search%")
                  ->orWhere('properties', 'like', "%$search%");

                // 2. Mapeo inteligente (con y sin acentos)
                $mappings = [
                    'empleado'   => \App\Models\User::class,
                    'usuario'    => \App\Models\User::class,
                    'vacaciones' => \App\Models\Vacation::class,
                    'festivo'    => \App\Models\HolidayDate::class,
                    // Búsqueda específica de sub-tipos (Nómina vs Contrato)
                    'nomina'     => [\App\Models\Document::class, 'payroll'],
                    'contrato'   => [\App\Models\Document::class, 'contract'],
                    'certificado'=> [\App\Models\Document::class, 'certificate'],
                    // Búsqueda general de documentos
                    'documento'  => \App\Models\Document::class,
                    'archivo'    => \App\Models\Document::class,
                    // Estados
                    'aprobado'   => 'approved',
                    'rechazado'  => 'rejected',
                    'cancelado'  => 'canceled',
                ];
                
                foreach ($mappings as $kw => $val) {
                    if (str_contains($searchNorm, $kw)) {
                        if (is_array($val)) {
                            // Si busca "nómina", queremos que sea Document Y que tenga el tipo "payroll"
                            $q->orWhere(function($subq) use ($val) {
                                $subq->where('subject_type', 'like', "%" . str_replace('\\', '\\\\', $val[0]) . "%")
                                     ->where('properties', 'like', "%$val[1]%");
                            });
                        } elseif (is_string($val) && str_contains($val, 'Models')) {
                            // Si busca "documento" o "empleado", buscamos por la clase entera
                            $q->orWhere('subject_type', 'like', "%" . str_replace('\\', '\\\\', $val) . "%");
                        } else {
                            // Palabra clave general (aprobado, rechazado...)
                            $q->orWhere('properties', 'like', "%$val%")
                              ->orWhere('event', 'like', "%$val%");
                        }
                    }
                }

                // 3. Buscar por Personas (Causer o Subject)
                $personSearch = function($sq) use ($search) {
                    $sq->where('name', 'like', "%$search%")
                      ->orWhere('surname', 'like', "%$search%")
                      ->orWhereRaw("CONCAT(name, ' ', surname) LIKE ?", ["%$search%"]);
                };

                $q->orWhereHasMorph('causer', [\App\Models\User::class], $personSearch)
                  ->orWhereHasMorph('subject', [\App\Models\User::class], $personSearch);

                // Caso especial: El sujeto tiene relación con usuario
                $q->orWhereHasMorph('subject', [\App\Models\Vacation::class, \App\Models\Document::class, \App\Models\VacationBalance::class], function($sq) use ($personSearch) {
                    $sq->whereHas('user', $personSearch);
                });
            });
        }

        // Orden de la tabla
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $perPage = $request->input('per_page', 10);
        $logs = $query->paginate($perPage);

        // Añadimos información extra del sujeto para que el frontend no tenga que buscar nombres de empleados
        $logs->getCollection()->transform(function($log) {
            $subject = $log->subject;
            $log->subject_name = null;
            
            if ($subject) {
                if ($log->subject_type === \App\Models\User::class) {
                    $log->subject_name = "{$subject->name} {$subject->surname}";
                } elseif (method_exists($subject, 'user')) {
                    $u = $subject->user;
                    if ($u) $log->subject_name = "{$u->name} {$u->surname}";
                } elseif (isset($subject->user_id)) {
                    $u = \App\Models\User::find($subject->user_id);
                    if ($u) $log->subject_name = "{$u->name} {$u->surname}";
                }
            }
            return $log;
        });

        return response()->json($logs);
    }
}

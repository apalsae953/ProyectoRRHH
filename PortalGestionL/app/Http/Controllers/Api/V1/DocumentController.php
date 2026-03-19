<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Resources\V1\DocumentResource;
use App\Http\Requests\Api\V1\StoreDocumentRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class DocumentController extends Controller
{
    public function myDocuments(Request $request)
    {
        $query = $request->user()->documents();

        // Aplicar filtros si vienen en la URL (ej: ?type=payroll&period_year=2025)
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('period_year')) {
            $query->where('period_year', $request->period_year);
        }
        if ($request->has('period_month')) {
            $query->where('period_month', $request->period_month);
        }

        $documents = $query->latest()->paginate(10);
        return DocumentResource::collection($documents);
    }

    public function employeeDocuments(Request $request, User $employee)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $query = $employee->documents();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('period_year')) {
            $query->where('period_year', $request->period_year);
        }

        return DocumentResource::collection($query->latest()->paginate(20));
    }


    public function store(StoreDocumentRequest $request, User $employee)
    {
        $file = $request->file('file');
        
        // Guardar el archivo en una carpeta privada del servidor (storage/app/documents)
        $path = $file->store('documents'); 

        $document = Document::create([
            'user_id' => $employee->id,
            'type' => $request->type,
            'period_year' => $request->period_year,
            'period_month' => $request->period_month,
            'title' => $request->title,
            'path' => $path,
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
            'uploaded_by' => $request->user()->id,
            'visibility' => $request->visibility,
        ]);

        // Enviar notificación al empleado
        try {
            \Illuminate\Support\Facades\Mail::to($employee->email)->send(new \App\Mail\DocumentUploadedNotification($document));
        } catch (\Exception $e) {
            Log::error('Error enviando notificación de documento: ' . $e->getMessage());
        }

        return new DocumentResource($document);
    }

    public function download(Request $request, Document $document)
    {
        $user = $request->user();

        // Si hay una sesión de usuario, validamos que tenga permisos
        if ($user) {
            // Validar que es su propio documento o es RRHH/Admin
            if ($document->user_id !== $user->id && !$user->hasRole(['admin', 'hr_director'])) {
                return response()->json(['message' => 'Acceso denegado'], 403);
            }
        } 
        // Si no hay usuario, el middleware 'signed' en api.php ya ha validado que la URL es auténtica y temporal

        if (!Storage::exists($document->path)) {
            return response()->json(['message' => 'Archivo no encontrado'], 404);
        }

        // Descarga directa del archivo privado
        $extension = 'pdf';
        if (str_contains($document->mime ?? '', 'image/jpeg')) $extension = 'jpg';
        elseif (str_contains($document->mime ?? '', 'image/png')) $extension = 'png';

        // Registrar la descarga en el log de auditoría
        activity()
            ->performedOn($document)
            ->causedBy($user ?: $document->user) // Si no hay usuario logueado en la sesión (URL firmada), atribuimos al dueño o indicamos que fue via link
            ->log($user ? 'Descarga de documento' : 'Descarga vía URL firmada');

        return Storage::response($document->path, $document->title . '.' . $extension);
    }

    public function update(Request $request, Document $document)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'nullable|in:payroll,contract,certificate,other',
            'period_year' => 'nullable|integer',
            'period_month' => 'nullable|integer',
        ]);

        $document->update($validatedData);

        return new DocumentResource($document);
    }

    public function destroy(Request $request, Document $document)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        // Borrar el archivo físico del disco
        if (Storage::exists($document->path)) {
            Storage::delete($document->path);
        }

        $document->delete();

        return response()->json(['message' => 'Documento eliminado correctamente']);
    }
}
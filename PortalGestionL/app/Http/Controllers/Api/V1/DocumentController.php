<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Resources\V1\DocumentResource;
use App\Http\Requests\Api\V1\StoreDocumentRequest;
use Illuminate\Support\Facades\Storage;

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

        return new DocumentResource($document);
    }

    public function download(Request $request, Document $document)
    {
        $user = $request->user();

        // Validar que es su propio documento o es RRHH/Admin
        if ($document->user_id !== $user->id && !$user->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        if (!Storage::exists($document->path)) {
            return response()->json(['message' => 'Archivo no encontrado'], 404);
        }

        // Descarga directa del archivo privado
        return Storage::download($document->path, $document->title . '.pdf');
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
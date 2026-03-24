<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $news = News::with('user')->latest('pinned')->latest('published_at')->get();
        return \App\Http\Resources\V1\NewsResource::collection($news);
    }

    public function store(Request $request)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'No tienes permiso para publicar noticias.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|string|in:news,event,policy',
            'image' => 'nullable|string',
            'pinned' => 'nullable|boolean',
            'published_at' => 'nullable|date',
        ]);

        $validated['user_id'] = $request->user()->id;

        $news = News::create($validated);

        return new \App\Http\Resources\V1\NewsResource($news);
    }

    public function show(News $news)
    {
        return new \App\Http\Resources\V1\NewsResource($news->load('user'));
    }

    public function update(Request $request, News $news)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'No tienes permiso para editar noticias.'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'type' => 'sometimes|string|in:news,event,policy',
            'image' => 'nullable|string',
            'pinned' => 'nullable|boolean',
            'published_at' => 'nullable|date',
        ]);

        $news->update($validated);

        return new \App\Http\Resources\V1\NewsResource($news);
    }

    public function destroy(News $news, Request $request)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'No tienes permiso para borrar noticias.'], 403);
        }

        $news->delete();

        return response()->json(['message' => 'Noticia eliminada correctamente.']);
    }
}

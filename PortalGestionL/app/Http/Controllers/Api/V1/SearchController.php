<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\News;
use App\Models\Document;
use App\Http\Resources\V1\EmployeeResource;
use App\Http\Resources\V1\NewsResource;
use App\Http\Resources\V1\DocumentResource;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $q = $request->query('q');

        if (!$q || strlen($q) < 2) {
            return response()->json([
                'employees' => [],
                'news' => [],
                'documents' => []
            ]);
        }

        // Search Employees
        $employees = User::with(['position', 'department', 'roles'])
            ->where('name', 'like', "%{$q}%")
            ->orWhere('surname', 'like', "%{$q}%")
            ->orWhere('dni_normalizado', 'like', "%" . strtoupper($q) . "%")
            ->limit(5)
            ->get();

        // Search News
        $news = News::where('title', 'like', "%{$q}%")
            ->orWhere('content', 'like', "%{$q}%")
            ->limit(5)
            ->latest()
            ->get();

        // Search Documents
        $documents = Document::where('user_id', $request->user()->id)
            ->where(function($query) use ($q) {
                $query->where('title', 'like', "%{$q}%")
                      ->orWhere('type', 'like', "%{$q}%");
            })
            ->limit(5)
            ->latest()
            ->get();

        return response()->json([
            'employees' => EmployeeResource::collection($employees),
            'news' => NewsResource::collection($news),
            'documents' => DocumentResource::collection($documents)
        ]);
    }
}

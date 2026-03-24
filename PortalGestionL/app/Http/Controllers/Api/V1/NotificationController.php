<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification;

class NotificationController extends Controller
{
    /**
     * GET /api/v1/notifications
     */
    public function index(Request $request)
    {
        return $request->user()->notifications()
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * PATCH /api/v1/notifications/{notification}/read
     */
    public function markAsRead(Notification $notification)
    {
        $notification->update(['is_read' => true]);
        return response()->json(['success' => true]);
    }

    /**
     * POST /api/v1/notifications/clear-all
     */
    public function clearAll(Request $request)
    {
        $request->user()->notifications()->update(['is_read' => true]);
        return response()->json(['success' => true]);
    }
}

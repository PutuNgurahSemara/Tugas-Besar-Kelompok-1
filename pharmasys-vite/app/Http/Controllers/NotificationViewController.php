<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationViewController extends Controller
{
    /**
     * Menampilkan halaman notifikasi
     */
    public function index()
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->through(function ($notification) {
                return [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'description' => $notification->description,
                    'time' => $notification->created_at->diffForHumans(),
                    'unread' => (bool) $notification->unread,
                    'type' => $notification->type,
                    'link' => $notification->link,
                    'created_at' => $notification->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }
}

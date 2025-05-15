<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Mendapatkan semua notifikasi untuk user tertentu
     */
    public function index()
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'description' => $notification->description,
                    'time' => $notification->created_at->diffForHumans(),
                    'unread' => (bool) $notification->unread,
                    'type' => $notification->type,
                    'link' => $notification->link
                ];
            });

        return response()->json($notifications);
    }

    /**
     * Menandai notifikasi sebagai telah dibaca
     */
    public function markAsRead(Request $request, $id = null)
    {
        if ($id) {
            // Tandai satu notifikasi sebagai telah dibaca
            $notification = Notification::where('user_id', Auth::id())
                ->where('id', $id)
                ->first();

            if ($notification) {
                $notification->update(['unread' => false]);
                return response()->json(['status' => 'success']);
            }

            return response()->json(['status' => 'error', 'message' => 'Notification not found'], 404);
        } else {
            // Tandai semua notifikasi sebagai telah dibaca
            Notification::where('user_id', Auth::id())
                ->where('unread', true)
                ->update(['unread' => false]);

            return response()->json(['status' => 'success']);
        }
    }

    /**
     * Menghapus notifikasi
     */
    public function destroy($id)
    {
        $notification = Notification::where('user_id', Auth::id())
            ->where('id', $id)
            ->first();

        if ($notification) {
            $notification->delete();
            return response()->json(['status' => 'success']);
        }

        return response()->json(['status' => 'error', 'message' => 'Notification not found'], 404);
    }
}

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
        try {
            // Pastikan user sudah login
            if (!Auth::check()) {
                return response()->json([], 200); // Return empty array untuk user yang belum login
            }
            
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
        } catch (\Exception $e) {
            // Log error dan return empty array
            \Log::error('Error fetching notifications: ' . $e->getMessage());
            return response()->json([], 200); // Return empty array saat terjadi error
        }
    }

    /**
     * Menandai notifikasi sebagai telah dibaca
     */
    public function markAsRead(Request $request, $id = null)
    {
        try {
            // Pastikan user sudah login
            if (!Auth::check()) {
                return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 200);
            }
            
            if ($id) {
                // Tandai satu notifikasi sebagai telah dibaca
                $notification = Notification::where('user_id', Auth::id())
                    ->where('id', $id)
                    ->first();

                if ($notification) {
                    $notification->update(['unread' => false]);
                    return response()->json(['status' => 'success']);
                }

                return response()->json(['status' => 'error', 'message' => 'Notification not found'], 200);
            } else {
                // Tandai semua notifikasi sebagai telah dibaca
                Notification::where('user_id', Auth::id())
                    ->where('unread', true)
                    ->update(['unread' => false]);

                return response()->json(['status' => 'success']);
            }
        } catch (\Exception $e) {
            // Log error dan return error message
            \Log::error('Error marking notification as read: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Server error'], 200);
        }
    }

    /**
     * Menghapus notifikasi
     */
    public function destroy($id)
    {
        try {
            // Pastikan user sudah login
            if (!Auth::check()) {
                return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 200);
            }
            
            $notification = Notification::where('user_id', Auth::id())
                ->where('id', $id)
                ->first();

            if ($notification) {
                $notification->delete();
                return response()->json(['status' => 'success']);
            }

            return response()->json(['status' => 'error', 'message' => 'Notification not found'], 200);
        } catch (\Exception $e) {
            // Log error dan return error message
            \Log::error('Error deleting notification: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Server error'], 200);
        }
    }
}

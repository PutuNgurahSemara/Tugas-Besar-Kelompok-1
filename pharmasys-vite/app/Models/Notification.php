<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\AsCollection;

class Notification extends Model
{
    use HasFactory;
    
    /**
     * Nama tabel yang terkait dengan model ini
     *
     * @var string
     */
    protected $table = 'custom_notifications';

    /**
     * Atribut yang dapat diisi (mass assignable)
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'description',
        'unread',
        'type',
        'data',
        'user_id',
        'link'
    ];

    /**
     * Konversi atribut ke tipe data tertentu
     *
     * @var array
     */
    protected $casts = [
        'unread' => 'boolean',
        'data' => 'array',
    ];

    // Relasi ke user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Mendapatkan waktu relatif
    public function getFormattedTimeAttribute()
    {
        return $this->created_at->diffForHumans();
    }
}

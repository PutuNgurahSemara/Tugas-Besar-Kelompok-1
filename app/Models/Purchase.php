<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number', 'supplier_id', 'invoice_date', 'due_date',
        'payment_date', 'total', 'status', 'note'
    ];

    /**
     * Casts untuk mengubah tipe data
     */
    protected $casts = [
        'quantity' => 'integer',
    ];

    /**
     * Relasi ke supplier
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Relasi ke kategori
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
    
    /**
     * Relasi ke produk (many)
     */
    public function produk(): HasMany
    {
        return $this->hasMany(Produk::class);
    }

    /**
     * Jumlah produk yang tersedia (total purchase - total produk)
     */
    public function getAvailableQuantityAttribute()
    {
        // Gunakan relasi langsung untuk menghitung jumlah produk
        $totalProduk = $this->produk()->sum('quantity');
        return $this->quantity - $totalProduk;
    }

    public function items() {
        return $this->hasMany(PurchaseItem::class);
    }
}

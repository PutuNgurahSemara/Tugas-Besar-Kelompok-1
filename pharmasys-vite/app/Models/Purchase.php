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
        'no_faktur',
        'pbf',
        'tanggal_faktur',
        'jatuh_tempo',
        'jumlah',
        'total',
        'tanggal_pembayaran',
        'keterangan',
        'supplier_id',
    ];

    /**
     * Casts untuk mengubah tipe data
     */
    protected $casts = [
        'jumlah' => 'integer',
        'total' => 'float',
        'tanggal_faktur' => 'date',
        'jatuh_tempo' => 'date',
        'tanggal_pembayaran' => 'date',
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
     * Relasi ke detail pembelian
     */
    public function details(): HasMany
    {
        return $this->hasMany(PurchaseDetail::class);
    }
    
    /**
     * Get all products associated with this purchase through purchase details
     */
    public function products()
    {
        return Produk::whereHas('purchaseDetails', function($query) {
            $query->where('purchase_id', $this->id);
        });
    }
    
    /**
     * Check if this purchase has been paid
     */
    public function getIsPaidAttribute()
    {
        return !is_null($this->tanggal_pembayaran);
    }
    
    /**
     * Check if this purchase is overdue
     */
    public function getIsOverdueAttribute()
    {
        if ($this->is_paid) {
            return false;
        }
        
        return $this->jatuh_tempo && $this->jatuh_tempo->isPast();
    }
    
    /**
     * Get days until due date (negative if overdue)
     */
    public function getDaysUntilDueAttribute()
    {
        if (!$this->jatuh_tempo) {
            return null;
        }
        
        return now()->diffInDays($this->jatuh_tempo, false);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseDetail extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'purchase_id',
        'produk_id',
        'nama_produk',
        'expired',
        'jumlah',
        'kemasan',
        'harga_satuan',
        'gross_amount', // Added
        'discount_percentage', // Added
        'total', // This is item's sub_total (after discount)
    ];

    protected $casts = [
        'expired' => 'date',
        'jumlah' => 'integer',
        'harga_satuan' => 'float',
        'gross_amount' => 'float', // Added
        'discount_percentage' => 'float', // Added
        'total' => 'float',
    ];

    /**
     * Get the purchase that owns this detail.
     */
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    /**
     * Get the product associated with this detail.
     */
    public function produk(): BelongsTo
    {
        return $this->belongsTo(Produk::class);
    }

    /**
     * Get the available quantity (not used in sales)
     */
    public function getAvailableQuantityAttribute()
    {
        // Calculate how much of this purchase detail has been used in sales
        // This is a placeholder - you'll need to implement the actual calculation
        // based on your sales model structure
        $usedInSales = 0; // Replace with actual calculation
        
        return $this->jumlah - $usedInSales;
    }
}

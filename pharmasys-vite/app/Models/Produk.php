<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Produk extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'produk';

    protected $fillable = [
        'nama', 
        'category_id', 
        'harga', 
        'margin', 
        'image',
    ];

    protected $casts = [
        'harga' => 'integer',
        'margin' => 'float',
    ];

    /**
     * Get the category that owns the produk.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
    
    /**
     * Get the purchase details associated with this product.
     */
    public function purchaseDetails(): HasMany
    {
        return $this->hasMany(PurchaseDetail::class);
    }
    
    /**
     * Get the total stock quantity from all purchase details.
     */
    public function getTotalStockAttribute()
    {
        return $this->purchaseDetails()->sum('jumlah');
    }
    
    /**
     * Get the available stock quantity (not used in sales).
     */
    public function getAvailableStockAttribute()
    {
        // This is a placeholder - you'll need to implement the actual calculation
        // based on your sales model structure
        $totalStock = $this->total_stock;
        $usedInSales = 0; // Replace with actual calculation from sales
        
        return $totalStock - $usedInSales;
    }
    
    /**
     * Get the earliest expiry date from all purchase details.
     */
    public function getEarliestExpiryAttribute()
    {
        $earliestExpiry = $this->purchaseDetails()
            ->whereNotNull('expired')
            ->orderBy('expired')
            ->first();
            
        return $earliestExpiry ? $earliestExpiry->expired : null;
    }
    
    /**
     * Check if the product is out of stock.
     */
    public function getIsOutOfStockAttribute()
    {
        return $this->available_stock <= 0;
    }
    
    /**
     * Check if the product has any expired items.
     */
    public function getHasExpiredItemsAttribute()
    {
        return $this->purchaseDetails()
            ->whereNotNull('expired')
            ->where('expired', '<', now())
            ->where('jumlah', '>', 0)
            ->exists();
    }
}

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

    protected $table = 'produk'; // Ensure this is 'produks' if following convention, or 'produk' if explicitly set. Assuming 'produk'.

    const STATUS_DRAFT = 'draft';
    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'nama', 
        'category_id', 
        'harga', 
        'margin', 
        'image',
        'status',
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

    /**
     * Check if the product is low on stock based on settings.
     */
    public function getIsLowStockAttribute()
    {
        // Ensure Setting model is used correctly
        $lowStockThreshold = (int) \App\Models\Setting::getValue('low_stock_threshold', 10);
        
        // Product is low on stock if available_stock is > 0 but <= threshold
        // and not already considered out of stock.
        return $this->available_stock > 0 && $this->available_stock <= $lowStockThreshold;
    }

    /**
     * Appends custom attributes to array/JSON form.
     */
    protected $appends = [
        'total_stock', 
        'available_stock', 
        'earliest_expiry',
        'is_out_of_stock',
        'has_expired_items',
        'is_low_stock' // Add the new accessor here
    ];
}

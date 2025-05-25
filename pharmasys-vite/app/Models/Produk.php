<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\SaleItem;

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
     * Get the sale items associated with this product.
     */
    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }
    
    /**
     * Get the total stock quantity from all purchase details.
     */
    public function getTotalStockAttribute()
    {
        return $this->purchaseDetails()->sum('jumlah');
    }
    
    /**
     * Get the available stock quantity.
     * Returns negative value if sold quantity exceeds purchased quantity.
     */
    public function getAvailableStockAttribute()
    {
        $totalPurchased = $this->purchaseDetails()->sum('jumlah');
        $totalSold = $this->saleItems()->sum('quantity');
        
        // Hitung stok yang tersedia (bisa negatif jika penjualan melebihi pembelian)
        return $totalPurchased - $totalSold;
    }
    
    /**
     * Get the displayable stock quantity (never negative).
     */
    public function getDisplayStockAttribute()
    {
        return max(0, $this->available_stock);
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
     * Check if the product has invalid stock (sold more than purchased).
     * Returns true if total sales > total purchases.
     */
    public function getHasInvalidStockAttribute()
    {
        $totalPurchased = $this->purchaseDetails()->sum('jumlah');
        $totalSold = $this->saleItems()->sum('quantity');
        
        return $totalSold > $totalPurchased;
    }
    
    /**
     * Get the invalid stock quantity (negative value indicates how much over the limit).
     */
    public function getInvalidStockQuantityAttribute()
    {
        $totalPurchased = $this->purchaseDetails()->sum('jumlah');
        $totalSold = $this->saleItems()->sum('quantity');
        
        return $totalSold - $totalPurchased;
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
        $lowStockThreshold = (int) \App\Models\Setting::getValue('low_stock_threshold', 10);
        
        // Product is low on stock if:
        // 1. Available stock is positive and <= threshold, OR
        // 2. Stock is negative (invalid state that needs attention)
        return ($this->available_stock > 0 && $this->available_stock <= $lowStockThreshold) || 
               $this->available_stock < 0;
    }

    /**
     * Appends custom attributes to array/JSON form.
     */
    protected $appends = [
        'total_stock', 
        'available_stock',
        'display_stock',
        'earliest_expiry',
        'is_out_of_stock',
        'has_invalid_stock',
        'has_expired_items',
        'is_low_stock'
    ];
}

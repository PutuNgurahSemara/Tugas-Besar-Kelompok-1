<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    protected $fillable = [
        'purchase_id', 'product_name', 'expired', 'quantity', 'unit', 'unit_price', 'total'
    ];

    public function purchase() {
        return $this->belongsTo(Purchase::class);
    }
} 
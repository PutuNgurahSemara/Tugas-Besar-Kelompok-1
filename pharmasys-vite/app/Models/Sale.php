<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use HasFactory,SoftDeletes;

    protected $fillable = [
        'product_id','quantity','total_price'
    ];

    public function product(){
        return $this->belongsTo(Produk::class);
    }

    public function purchase(){
        return $this->belongsTo(Purchase::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class, 'sale_id');
    }
}

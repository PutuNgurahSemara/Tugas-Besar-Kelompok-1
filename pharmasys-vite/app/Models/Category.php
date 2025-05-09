<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function produk()
    {
        return $this->hasMany(Produk::class, 'category_id'); // Pastikan foreign key benar
    }
}

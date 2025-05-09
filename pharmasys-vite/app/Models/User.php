<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Support\Collection;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'name',
        'email',
        'avatar',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Load permissions relationship to the model.
     * Eager loading untuk memastikan relationship roles dan permissions selalu dimuat
     */
    protected $with = ['roles'];

    /**
     * Get the user's permissions list (untuk frontend, agar tidak menimpa relasi Eloquent permissions)
     *
     * @return array
     */
    public function getPermissionsListAttribute()
    {
        try {
            return $this->getUserPermissions();
        } catch (\Exception $e) {
            // Log error dan kembalikan array kosong jika terjadi error
            \Log::error('Error mendapatkan permissions: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Method alternatif untuk mendapatkan permissions user.
     * Lebih aman dan meminimalisir kemungkinan error.
     *
     * @return array
     */
    public function getUserPermissions()
    {
        // Pastikan roles dimuat
        if (!$this->relationLoaded('roles')) {
            $this->load('roles.permissions');
        }
        
        // Jika tidak memiliki roles, kembalikan array kosong
        if (!$this->roles || $this->roles->isEmpty()) {
            return [];
        }
        
        // Kumpulkan semua izin dari semua peran
        $permissions = [];
        
        foreach ($this->roles as $role) {
            if ($role->permissions) {
                foreach ($role->permissions as $permission) {
                    if (isset($permission->name)) {
                        $permissions[] = $permission->name;
                    }
                }
            }
        }
        
        // Hapus duplikat
        return array_values(array_unique($permissions));
    }

    /**
     * Append additional attributes to the model.
     * Menambahkan atribut permissions_list ke hasil JSON
     *
     * @var array
     */
    protected $appends = ['permissions_list'];
}

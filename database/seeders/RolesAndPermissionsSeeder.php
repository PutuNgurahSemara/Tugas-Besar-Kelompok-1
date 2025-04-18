<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // List of permissions
        $arrayOfPermissionNames = [
            'view-sales', 'create-sale', 'destroy-sale', 'edit-sale',
            'view-reports', 'view-category', 'create-category', 'destroy-category', 'edit-category',
            'view-products', 'create-product', 'edit-product', 'destroy-product',
            'view-purchase', 'create-purchase', 'edit-purchase', 'destroy-purchase',
            'view-supplier', 'create-supplier', 'edit-supplier', 'destroy-supplier',
            'view-users', 'create-user', 'edit-user', 'destroy-user',
            'view-access-control',
            'view-role', 'edit-role', 'destroy-role', 'create-role',
            'view-permission', 'create-permission', 'edit-permission', 'destroy-permission',
            'view-expired-products', 'view-outstock-products',
            'backup-app', 'backup-db', 'view-settings',
        ];

        // Insert if not exists
        $permissions = collect($arrayOfPermissionNames)->map(function ($permission) {
            return ['name' => $permission, 'guard_name' => 'web'];
        });

        $permissions->each(function ($permission) {
            Permission::firstOrCreate($permission);
        });

        // Create roles and assign permissions
        $role = Role::firstOrCreate(['name' => 'sales-person']);
        $role->givePermissionTo(['view-sales', 'view-reports', 'create-sale']);

        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdmin->givePermissionTo(Permission::all());
    }
}
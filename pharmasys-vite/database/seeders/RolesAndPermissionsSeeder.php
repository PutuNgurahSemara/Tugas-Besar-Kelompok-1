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
        // Reset permissions cache
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Truncate tables (PostgreSQL version)
        app('db')->statement('TRUNCATE TABLE role_has_permissions CASCADE');
        app('db')->statement('TRUNCATE TABLE model_has_roles CASCADE');
        app('db')->statement('TRUNCATE TABLE model_has_permissions CASCADE');
        app('db')->statement('TRUNCATE TABLE permissions CASCADE');
        app('db')->statement('TRUNCATE TABLE roles CASCADE');

        // Create permissions with more granular control
        $arrayOfPermissionNames = [
            // Sales Transaction Permissions (More Granular)
            'view-sales-list',           // View sales transaction list
            'view-sales-details',        // View details of a specific sale
            'create-sale',               // Create new sale
            'delete-sale',               // Delete sale (admin only)
            'export-sales',              // Export sales data
            'view-sales-reports',        // View sales reports

            // Products Permissions
            'view-products',
            'create-product',
            'edit-product',
            'destroy-product',
            'view-expired-products',
            'view-outstock-products',

            // Categories Permissions
            'view-category',
            'create-category',
            'edit-category',
            'destroy-category',

            // Purchase Permissions
            'view-purchase',
            'create-purchase',
            'edit-purchase',
            'destroy-purchase',
            'import-purchase',
            'export-purchase',

            // Supplier Permissions
            'view-supplier',
            'create-supplier',
            'edit-supplier',
            'destroy-supplier',

            // User Management
            'view-users',
            'create-user',
            'edit-user',
            'destroy-user',

            // Access Control
            'view-access-control',
            'view-role',
            'create-role',
            'edit-role',
            'destroy-role',
            'view-permission',
            'create-permission',
            'edit-permission',
            'destroy-permission',

            // System
            'backup-app',
            'backup-db',
            'view-settings',
        ];

        $permissions = collect($arrayOfPermissionNames)->map(function ($permission) {
            return ['name' => $permission, 'guard_name' => 'web'];
        });

        Permission::insert($permissions->toArray());

        // Create Cashier Role with default permissions for sales
        $cashierRole = Role::create(['name' => 'cashier']);
        $cashierRole->givePermissionTo([
            'view-sales-list',
            'view-sales-details', 
            'create-sale',
            'view-sales-reports',
            'view-products',
            'view-expired-products',
            'view-outstock-products',
            'view-settings'
        ]);

        // Create Admin Role with all permissions
        $adminRole = Role::create(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        // Ensure admin has explicit permission for reports
        $adminRole->givePermissionTo([
            'view-sales-reports',
            'view-purchase',
            'view-sales-list',
            'view-sales-details'
        ]);
    }
}

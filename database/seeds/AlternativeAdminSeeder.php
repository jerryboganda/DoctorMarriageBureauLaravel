<?php

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AlternativeAdminSeeder extends Seeder
{
    /**
     * Alternative seeder in case you need different credentials
     * Run this seeder with: php artisan db:seed --class=AlternativeAdminSeeder
     */
    public function run()
    {
        // You can customize these credentials as needed
        $adminData = [
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com', // Change this as needed
            'password' => Hash::make('welcome123'), // Change this as needed
            'user_type' => 'admin',
            'email_verified_at' => now(),
            'approved' => 1,
            'blocked' => 0,
            'deactivated' => 0,
        ];

        // Check if admin user already exists
        $existingAdmin = User::where('email', $adminData['email'])->first();
        
        if (!$existingAdmin) {
            // Create admin user
            $admin = User::create($adminData);

            // Check if Super Admin role exists, if not create it
            $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
            
            // Assign Super Admin role
            $admin->assignRole('Super Admin');

            $this->command->info('Alternative admin user created successfully!');
            $this->command->info('Email: ' . $adminData['email']);
            $this->command->info('Password: welcome123');
        } else {
            $this->command->info('Admin user with this email already exists!');
        }
    }
}
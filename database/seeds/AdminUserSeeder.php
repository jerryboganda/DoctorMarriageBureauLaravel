<?php

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Check if admin user already exists
        $existingAdmin = User::where('email', 'admin@admin.com')->first();
        
        if (!$existingAdmin) {
            // Create admin user
            $admin = User::create([
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'email' => 'admin@admin.com',
                'password' => Hash::make('welcome123'),
                'user_type' => 'admin',
                'email_verified_at' => now(),
                'approved' => 1,
                'blocked' => 0,
                'deactivated' => 0,
            ]);

            // Check if Super Admin role exists, if not create it
            $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
            
            // Assign Super Admin role
            $admin->assignRole('Super Admin');

            $this->command->info('Admin user created successfully!');
            $this->command->info('Email: admin@admin.com');
            $this->command->info('Password: welcome123');
        } else {
            $this->command->info('Admin user already exists!');
        }
    }
}

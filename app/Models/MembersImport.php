<?php

namespace App\Models;

use Hash;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;

class MembersImport implements ToCollection
{
    public function collection(Collection $rows)
    {
        foreach ($rows as $key => $row) {
            if ($key != 0) {
                try {
                    $membership = ($row[7] == 1) ? 1 : 2;
                    $user = User::create([
                        'user_type' => 'member',
                        'code' => unique_code(),
                        'first_name' => $row[0],
                        'last_name' => $row[1],
                        'email' => $row[2],
                        'email_verified_at' => date('Y-m-d H:m:s'),
                        'password' => Hash::make($row[8]),
                        'phone' => $row[5],
                        'membership' => $membership,
                    ]);

                    $package = Package::where('id', $row[7])->first();

                    Member::create([
                        'user_id' => $user->id,
                        'gender' => $row[3],
                        'on_behalves_id' => $row[6],
                        'birthday' => date('Y-m-d', strtotime($row[4])),
                        'current_package_id' => $package->id,
                        'remaining_interest' => $package->express_interest,
                        'remaining_contact_view' => $package->contact,
                        'remaining_photo_gallery' => $package->photo_gallery,
                        'auto_profile_match' => $package->auto_profile_match,
                        'package_validity' => date('Y-m-d', strtotime($package->validity.' days')),
                    ]);
                } catch (\Exception $e) {
                    //
                }
            }
            $key = $key + 1;
        }
    }
}

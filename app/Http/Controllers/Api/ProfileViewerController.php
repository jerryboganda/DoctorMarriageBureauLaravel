<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Http\Resources\MyProfileViewerResource;
use App\Models\ProfileViewer;

class ProfileViewerController extends Controller
{
    public function my_profile_viewers()
    {
        $profileViewers = ProfileViewer::where('user_id', auth()->user()->id)
                            ->whereIn("viewed_by", function ($query) {
                                $query->select('id')
                                    ->from('users')
                                    ->where('approved', '1')
                                    ->where('blocked', 0)
                                    ->where('deactivated', 0)
                                    ->where('permanently_delete', 0);
                            })->paginate(10);  

        return MyProfileViewerResource::collection($profileViewers)->additional([
            'result' => true
        ]);
    }

}

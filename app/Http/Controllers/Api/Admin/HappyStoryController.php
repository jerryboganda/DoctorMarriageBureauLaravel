<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\HappyStory;

class HappyStoryController extends CrudController
{
    protected string $modelClass = HappyStory::class;

    protected array $searchColumns = ['title', 'partner_name'];

    protected array $relations = ['user'];

    protected array $sortable = ['id', 'title', 'approved', 'created_at'];

    public function toggleApproval($id)
    {
        $story = HappyStory::findOrFail($id);
        $story->approved = (int) ! $story->approved;
        $story->save();

        return $this->ok($story, 'Story approval updated');
    }
}

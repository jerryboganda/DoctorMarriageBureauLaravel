<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\EmailTemplate;
use Illuminate\Http\Request;

class EmailTemplateController extends BaseAdminController
{
    public function index(Request $request)
    {
        $query = EmailTemplate::query()->orderBy('identifier');
        if ($search = $request->get('search')) {
            $query->where('identifier', 'like', '%'.$search.'%')
                ->orWhere('subject', 'like', '%'.$search.'%');
        }

        return $this->ok($this->paginateQuery($request, $query));
    }

    public function update(Request $request)
    {
        $id = $request->get('id');
        if (! $id) {
            return $this->fail('Template id is required', 422);
        }

        $template = EmailTemplate::findOrFail($id);
        foreach ($request->except(['id', '_token']) as $key => $value) {
            $template->{$key} = $value;
        }
        $template->save();

        return $this->ok($template, 'Email template updated');
    }

    public function show($id)
    {
        $template = EmailTemplate::findOrFail($id);

        return $this->ok($template);
    }

    public function updateById(Request $request, $id)
    {
        $template = EmailTemplate::findOrFail($id);
        foreach ($request->except(['id', '_token', '_method']) as $key => $value) {
            $template->{$key} = $value;
        }
        $template->save();

        return $this->ok($template, 'Email template updated');
    }
}

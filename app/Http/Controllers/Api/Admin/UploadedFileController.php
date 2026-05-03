<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Upload;
use Illuminate\Http\Request;

class UploadedFileController extends BaseAdminController
{
    public function index(Request $request)
    {
        $query = Upload::query()->with('user')->orderByDesc('id');
        if ($search = $request->get('search')) {
            $query->where('file_original_name', 'like', '%' . $search . '%');
        }

        return $this->ok($this->paginateQuery($request, $query));
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $uploadId = upload_api_file($request->file('file'), $request->user()->id ?? null);
        $upload = Upload::find($uploadId);

        return $this->ok($upload, 'File uploaded successfully');
    }

    public function info($id)
    {
        $upload = Upload::with('user')->findOrFail($id);
        return $this->ok($upload);
    }

    public function destroy($id)
    {
        $upload = Upload::findOrFail($id);
        $upload->delete();

        return $this->ok(null, 'File deleted successfully');
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->get('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return $this->fail('No ids provided', 422);
        }

        Upload::whereIn('id', $ids)->delete();
        return $this->ok(null, 'Files deleted successfully');
    }
}

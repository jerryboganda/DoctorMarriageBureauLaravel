<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Language;
use App\Models\Translation;
use Illuminate\Http\Request;

class LanguageController extends CrudController
{
    protected string $modelClass = Language::class;

    protected array $searchColumns = ['name', 'code'];

    protected array $sortable = ['id', 'name', 'code', 'created_at'];

    public function toggleRtl($id)
    {
        $language = Language::findOrFail($id);
        $language->rtl = (int) ! $language->rtl;
        $language->save();

        return $this->ok($language, 'RTL status updated');
    }

    public function getTranslations($id)
    {
        $language = Language::findOrFail($id);
        $items = Translation::where('lang', $language->code)->orderBy('id')->paginate(100);

        return $this->ok([
            'language' => $language,
            'items' => $items->items(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function updateTranslations(Request $request, $id)
    {
        $language = Language::findOrFail($id);
        $translations = $request->get('translations', []);

        foreach ($translations as $item) {
            if (! isset($item['key'])) {
                continue;
            }
            Translation::updateOrCreate(
                ['lang' => $language->code, 'lang_key' => $item['key']],
                ['lang_value' => (string) ($item['value'] ?? '')]
            );
        }

        return $this->ok(null, 'Translations updated');
    }
}

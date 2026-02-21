<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Remove Sunni/Shia from castes (they are sects, not castes).
 * Add comprehensive Pakistani biradari/caste/clan list for Muslim religion.
 * Safely nullify caste_id for affected users.
 */
return new class extends Migration
{
    public function up(): void
    {
        $muslimReligionId = DB::table('religions')->where('name', 'Muslim')->value('id');
        if (!$muslimReligionId) {
            return; // safety check
        }

        // ─────────────────────────────────────────────────────────
        // 1. Nullify caste_id for users who selected Sunni or Shia
        // ─────────────────────────────────────────────────────────
        $sunniId = DB::table('castes')->where('name', 'Sunni')->where('religion_id', $muslimReligionId)->value('id');
        $shiaId  = DB::table('castes')->where('name', 'Shia')->where('religion_id', $muslimReligionId)->value('id');

        $removeIds = array_filter([$sunniId, $shiaId]);

        if (!empty($removeIds)) {
            // Clear from spiritual_backgrounds
            DB::table('spiritual_backgrounds')
                ->whereIn('caste_id', $removeIds)
                ->update(['caste_id' => null, 'updated_at' => now()]);

            // Clear from partner_expectations (just in case)
            DB::table('partner_expectations')
                ->whereIn('caste_id', $removeIds)
                ->update(['caste_id' => null, 'updated_at' => now()]);

            // Soft-delete Sunni and Shia from castes table
            DB::table('castes')
                ->whereIn('id', $removeIds)
                ->update(['deleted_at' => now()]);
        }

        // ─────────────────────────────────────────────────────────
        // 2. Comprehensive Pakistani castes / biradaris / clans
        //    Only insert if the name doesn't already exist for Muslim
        // ─────────────────────────────────────────────────────────
        $newCastes = [
            // Punjabi biradaris
            'Afridi',
            'Akhtar',
            'Aulakh',
            'Bajwa',
            'Baloch',
            'Baig',
            'Bhatti',
            'Bodla',
            'Chaudhry',
            'Cheema',
            'Chouhan',
            'Dar',
            'Durrani',
            'Gandapur',
            'Gill',
            'Gondal',
            'Goraya',
            'Ghumman',
            'Jutt',
            'Kahlon',
            'Kashmiri',
            'Khattar',
            'Khatri',
            'Khawaja',
            'Langrial',
            'Lodhi',
            'Mahar',
            'Minhas',
            'Mirza',
            'Niazi',
            'Noon',
            'Paracha',
            'Rana',
            'Ranjha',
            'Rathore',
            'Sethi',
            'Sial',
            'Sipra',
            'Tiwana',
            'Tarar',
            'Virk',
            'Vohra',
            'Warraich',
            'Wattoo',

            // Pashtun tribes
            'Bangash',
            'Khattak',
            'Marwat',
            'Mohmand',
            'Orakzai',
            'Shinwari',
            'Wazir',
            'Yousafzai',
            'Swati',
            'Jadoon',
            'Kakar',
            'Mandokhel',
            'Achakzai',
            'Kundi',
            'Dawar',
            'Mehsud',
            'Tareen',
            'Barakzai',

            // Sindhi castes
            'Soomro',
            'Talpur',
            'Shah',
            'Laghari',
            'Chandio',
            'Junejo',
            'Khoso',
            'Brohi',
            'Jamali',
            'Panhwar',
            'Bhurgri',
            'Abro',
            'Maitlo',

            // Baloch tribes
            'Bugti',
            'Marri',
            'Mengal',
            'Raisani',
            'Rind',
            'Lashari',
            'Mazari',
            'Jatoi',
            'Domki',

            // Muhajir / Other notable
            'Siddiqui',
            'Farooqi',
            'Usmani',
            'Dawood',
        ];

        $existing = DB::table('castes')
            ->where('religion_id', $muslimReligionId)
            ->whereNull('deleted_at')
            ->pluck('name')
            ->map(fn($n) => strtolower($n))
            ->toArray();

        $toInsert = [];
        $now = now();
        foreach ($newCastes as $name) {
            if (!in_array(strtolower($name), $existing)) {
                $toInsert[] = [
                    'name'        => $name,
                    'religion_id' => $muslimReligionId,
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ];
            }
        }

        if (!empty($toInsert)) {
            // Insert in chunks to avoid exceeding packet sizes
            foreach (array_chunk($toInsert, 50) as $chunk) {
                DB::table('castes')->insert($chunk);
            }
        }
    }

    public function down(): void
    {
        $muslimReligionId = DB::table('religions')->where('name', 'Muslim')->value('id');
        if (!$muslimReligionId) {
            return;
        }

        // Restore Sunni and Shia (un-soft-delete)
        DB::table('castes')
            ->where('religion_id', $muslimReligionId)
            ->whereIn('name', ['Sunni', 'Shia'])
            ->update(['deleted_at' => null]);

        // Note: Cannot restore user caste selections on rollback
        // Note: Newly added castes are NOT removed on rollback to protect data
    }
};

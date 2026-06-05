<?php

/**
 * Fix script to:
 * 1. Remove duplicate profile_option_values (keep only properly-slugged entries)
 * 2. Update user data in recidencies to use slug values
 * 3. Fix Pakistan state names (Baluchistan→Balochistan, Sind→Sindh, North-West Frontier→Khyber Pakhtunkhwa)
 * 4. Add cities for Khyber Pakhtunkhwa (KPK)
 */

// Database connection
$host = 'db'; // Docker service name
$db = 'marriagebureau';
$user = 'root';
$pass = 'MarriageBureauRootPass123!';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    exit('Connection failed: '.$e->getMessage()."\n");
}

echo "=== STEP 1: Fix duplicate profile_option_values ===\n\n";

// ---- IMMIGRATION STATUS ----
// Old rows (value = label): IDs 38 (Citizen), 39 (Dual National), 40 (Work Visa), 41 (Student Visa), 42 (Permanent Resident)
// New rows (value = slug): IDs 56 (dual_national), 57 (work_visa), 58 (student_visa), 59 (permanent_resident)
// NOTE: "citizen" slug is missing in the new entries. We need to add it or keep ID 38 but change its value to "citizen"

// First, check if "citizen" slug exists
$stmt = $pdo->query("SELECT id FROM profile_option_values WHERE `group` = 'immigration_status' AND value = 'citizen'");
$citizenSlug = $stmt->fetch();

if (! $citizenSlug) {
    echo "Adding 'citizen' slug entry for immigration_status...\n";
    $pdo->exec("INSERT INTO profile_option_values (`group`, value, label, sort_order, is_active) VALUES ('immigration_status', 'citizen', 'Citizen', 0, 1)");
    echo "  → Inserted citizen slug.\n";
} else {
    echo "  → citizen slug already exists (id: {$citizenSlug['id']}).\n";
}

// Update sort_order for new slug entries
$pdo->exec("UPDATE profile_option_values SET sort_order = 0 WHERE `group` = 'immigration_status' AND value = 'citizen'");
$pdo->exec("UPDATE profile_option_values SET sort_order = 1 WHERE `group` = 'immigration_status' AND value = 'dual_national'");
$pdo->exec("UPDATE profile_option_values SET sort_order = 2 WHERE `group` = 'immigration_status' AND value = 'work_visa'");
$pdo->exec("UPDATE profile_option_values SET sort_order = 3 WHERE `group` = 'immigration_status' AND value = 'student_visa'");
$pdo->exec("UPDATE profile_option_values SET sort_order = 4 WHERE `group` = 'immigration_status' AND value = 'permanent_resident'");
echo "  → Updated sort orders for immigration_status.\n";

// Update user data: map old label-values to new slug-values in recidencies
$mapping = [
    'Citizen' => 'citizen',
    'Dual National' => 'dual_national',
    'Work Visa' => 'work_visa',
    'Student Visa' => 'student_visa',
    'Permanent Resident' => 'permanent_resident',
];

foreach ($mapping as $old => $new) {
    $stmt = $pdo->prepare('UPDATE recidencies SET immigration_status = ? WHERE immigration_status = ?');
    $stmt->execute([$new, $old]);
    $count = $stmt->rowCount();
    if ($count > 0) {
        echo "  → Updated {$count} recidencies: '{$old}' → '{$new}'\n";
    }
}

// Delete old duplicate rows (where value = label, not a slug)
$oldIds = [38, 39, 40, 41, 42];
$pdo->exec('DELETE FROM profile_option_values WHERE id IN ('.implode(',', $oldIds).')');
echo '  → Deleted old duplicate immigration_status entries (IDs: '.implode(', ', $oldIds).")\n";

// ---- COMMUNITY VALUES ----
// Old: 52 "Traditional Values", 53 "Modern Values", 54 "Mix of both"
// New: 60 "Traditional", 61 "Modern", 62 "Islamic", 63 "Social", 68 "Optional"
echo "\nFixing community_values duplicates...\n";

// Check which tables store community_value
$tables = ['users', 'member_profiles'];
foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM {$table} LIKE 'community_value%'");
        $cols = $stmt->fetchAll();
        foreach ($cols as $col) {
            echo "  → Found column '{$col['Field']}' in table '{$table}'\n";
        }
    } catch (Exception $e) {
        // table doesn't exist, skip
    }
}

// Map old community values to new ones
$communityMapping = [
    'Traditional Values' => 'Traditional',
    'Modern Values' => 'Modern',
    'Mix of both' => 'Modern', // closest match
];

// Try updating in recidencies or wherever it's stored
$possibleTables = ['recidencies', 'users', 'member_profiles', 'personalities'];
foreach ($possibleTables as $table) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM {$table} LIKE '%community%'");
        $cols = $stmt->fetchAll();
        foreach ($cols as $col) {
            $colName = $col['Field'];
            echo "  → Found '{$colName}' in '{$table}'\n";
            foreach ($communityMapping as $old => $new) {
                $stmt2 = $pdo->prepare("UPDATE {$table} SET {$colName} = ? WHERE {$colName} = ?");
                $stmt2->execute([$new, $old]);
                $count = $stmt2->rowCount();
                if ($count > 0) {
                    echo "    → Updated {$count} rows: '{$old}' → '{$new}'\n";
                }
            }
        }
    } catch (Exception $e) {
        // skip
    }
}

// Delete old community_values duplicates
$pdo->exec('DELETE FROM profile_option_values WHERE id IN (52, 53, 54)');
echo "  → Deleted old duplicate community_values entries (IDs: 52, 53, 54)\n";

// ---- FAMILY TYPE ----
// Old: 36 value="Nuclear" label="Nuclear Family", 37 value="Joint" label="Joint Family"
// New: 55 value="extended" label="Extended Family"
// Need to add nuclear and joint as proper slugs, or update old rows
echo "\nFixing family_type entries...\n";

// Check if nuclear/joint slugs exist
$stmt = $pdo->query("SELECT id, value, label FROM profile_option_values WHERE `group` = 'family_type'");
$familyRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "  Current family_type entries:\n";
foreach ($familyRows as $row) {
    echo "    ID={$row['id']}, value='{$row['value']}', label='{$row['label']}'\n";
}

// Update old rows to use proper slug values instead of deleting (since user data may reference them)
// ID 36: Nuclear → nuclear
$pdo->exec("UPDATE profile_option_values SET value = 'nuclear', sort_order = 0 WHERE id = 36 AND value = 'Nuclear'");
// ID 37: Joint → joint
$pdo->exec("UPDATE profile_option_values SET value = 'joint', sort_order = 1 WHERE id = 37 AND value = 'Joint'");
$pdo->exec("UPDATE profile_option_values SET sort_order = 2 WHERE id = 55 AND value = 'extended'");
echo "  → Updated family_type values to proper slugs.\n";

// Update user data for family type
$familyMapping = ['Nuclear' => 'nuclear', 'Joint' => 'joint', 'Nuclear Family' => 'nuclear', 'Joint Family' => 'joint', 'Extended Family' => 'extended'];
foreach ($possibleTables as $table) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM {$table} LIKE '%family_type%'");
        $cols = $stmt->fetchAll();
        foreach ($cols as $col) {
            $colName = $col['Field'];
            foreach ($familyMapping as $old => $new) {
                $stmt2 = $pdo->prepare("UPDATE {$table} SET {$colName} = ? WHERE {$colName} = ?");
                $stmt2->execute([$new, $old]);
                $count = $stmt2->rowCount();
                if ($count > 0) {
                    echo "    → Updated {$count} rows in {$table}.{$colName}: '{$old}' → '{$new}'\n";
                }
            }
        }
    } catch (Exception $e) {
        // skip
    }
}

echo "\n=== STEP 2: Fix Pakistan state names ===\n\n";

// Fix Baluchistan → Balochistan
$stmt = $pdo->prepare('UPDATE states SET name = ? WHERE id = ?');
$stmt->execute(['Balochistan', 2723]);
echo "  → Renamed 'Baluchistan' to 'Balochistan' (ID: 2723)\n";

// Fix Sind → Sindh
$stmt->execute(['Sindh', 2729]);
echo "  → Renamed 'Sind' to 'Sindh' (ID: 2729)\n";

// Fix North-West Frontier → Khyber Pakhtunkhwa
$stmt->execute(['Khyber Pakhtunkhwa', 2726]);
echo "  → Renamed 'North-West Frontier' to 'Khyber Pakhtunkhwa' (ID: 2726)\n";

// Also fix "Federally administered Tribal" → "Federally Administered Tribal Areas (FATA)"
$stmt->execute(['FATA (Tribal Areas)', 2725]);
echo "  → Renamed 'Federally administered Tribal' to 'FATA (Tribal Areas)' (ID: 2725)\n";

echo "\n=== STEP 3: Add cities for Khyber Pakhtunkhwa (KPK) ===\n\n";

// KPK state_id = 2726
$kpkStateId = 2726;

// Major KPK cities
$kpkCities = [
    'Peshawar',
    'Abbottabad',
    'Mardan',
    'Mingora',
    'Nowshera',
    'Kohat',
    'Bannu',
    'Dera Ismail Khan',
    'Mansehra',
    'Haripur',
    'Charsadda',
    'Swabi',
    'Swat',
    'Dir',
    'Battagram',
    'Hangu',
    'Karak',
    'Lakki Marwat',
    'Tank',
    'Buner',
    'Shangla',
    'Chitral',
    'Lower Dir',
    'Upper Dir',
    'Malakand',
    'Timergara',
    'Daggar',
    'Takht-i-Bahi',
    'Risalpur',
    'Pabbi',
];

// Also add cities for other Pakistan states that might be missing
$balochCities = [
    'Quetta', 'Gwadar', 'Turbat', 'Khuzdar', 'Hub', 'Chaman',
    'Sibi', 'Zhob', 'Loralai', 'Dera Murad Jamali', 'Dera Bugti',
];

$sindhCities = [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah',
    'Mirpur Khas', 'Thatta', 'Badin', 'Jacobabad', 'Shikarpur',
    'Khairpur', 'Dadu', 'Tando Allahyar', 'Tando Adam', 'Umerkot',
];

$punjabCities = [
    'Lahore', 'Rawalpindi', 'Faisalabad', 'Multan', 'Gujranwala',
    'Sialkot', 'Bahawalpur', 'Sargodha', 'Sahiwal', 'Jhang',
    'Rahim Yar Khan', 'Sheikhupura', 'Gujrat', 'Kasur', 'Dera Ghazi Khan',
    'Jhelum', 'Chiniot', 'Mianwali', 'Okara', 'Attock',
    'Muzaffargarh', 'Vehari', 'Khanewal', 'Hafizabad', 'Bhakkar',
    'Toba Tek Singh', 'Narowal', 'Mandi Bahauddin', 'Lodhran', 'Layyah',
    'Chakwal',
];

$islamabadCities = [
    'Islamabad',
];

$northernAreasCities = [
    'Gilgit', 'Skardu', 'Hunza', 'Chilas', 'Astore',
    'Ghizer', 'Diamer', 'Ghanche',
];

$stateCities = [
    2726 => $kpkCities,        // KPK
    2723 => $balochCities,      // Balochistan
    2729 => $sindhCities,       // Sindh
    2728 => $punjabCities,      // Punjab
    2724 => $islamabadCities,   // Federal Capital Area
    2727 => $northernAreasCities, // Northern Areas
];

$insertStmt = $pdo->prepare('INSERT INTO cities (name, state_id) VALUES (?, ?)');

foreach ($stateCities as $stateId => $cities) {
    // Check which cities already exist
    $existingStmt = $pdo->prepare('SELECT name FROM cities WHERE state_id = ?');
    $existingStmt->execute([$stateId]);
    $existing = array_map('strtolower', $existingStmt->fetchAll(PDO::FETCH_COLUMN));

    $added = 0;
    foreach ($cities as $city) {
        if (! in_array(strtolower($city), $existing)) {
            $insertStmt->execute([$city, $stateId]);
            $added++;
        }
    }

    $stateName = $pdo->query("SELECT name FROM states WHERE id = {$stateId}")->fetchColumn();
    echo "  → {$stateName} (ID: {$stateId}): Added {$added} cities, ".count($existing)." already existed.\n";
}

echo "\n=== STEP 4: Verify results ===\n\n";

// Verify immigration_status
echo "Immigration Status options:\n";
$stmt = $pdo->query("SELECT id, value, label FROM profile_option_values WHERE `group` = 'immigration_status' ORDER BY sort_order");
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo "  ID={$row['id']}, value='{$row['value']}', label='{$row['label']}'\n";
}

// Verify Pakistan states
echo "\nPakistan states:\n";
$stmt = $pdo->query('SELECT id, name FROM states WHERE country_id = 166 ORDER BY name');
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo "  ID={$row['id']}, name='{$row['name']}'\n";
}

// Verify KPK cities
echo "\nKPK cities:\n";
$stmt = $pdo->query('SELECT id, name FROM cities WHERE state_id = 2726 ORDER BY name');
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo "  {$row['name']}\n";
}

// Count all profile_option_values
$count = $pdo->query('SELECT COUNT(*) FROM profile_option_values')->fetchColumn();
echo "\nTotal profile_option_values: {$count}\n";

echo "\n=== ALL FIXES APPLIED SUCCESSFULLY ===\n";

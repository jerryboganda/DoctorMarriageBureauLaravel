<?php

/**
 * CircleCI Test Database Import Helper
 * Imports the baseline schema from matrimonial1.sql into the testing database
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== CircleCI Test Database Import ===\n";

$host = '127.0.0.1';
$user = 'root';
$password = 'root';
$database = 'dmb_test';
$sqlFile = __DIR__.'/matrimonial1.sql';

try {
    echo "Connecting to MySQL at $host...\n";
    $connection = new PDO("mysql:host=$host", $user, $password);
    $connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "[✓] Connected successfully\n";

    echo "Recreating test database '$database'...\n";
    $connection->exec("DROP DATABASE IF EXISTS $database");
    $connection->exec("CREATE DATABASE $database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $connection->exec("USE $database");
    echo "[✓] Database recreation complete\n";

    echo "Loading SQL baseline file...\n";
    if (! file_exists($sqlFile)) {
        throw new Exception("Baseline SQL file not found: $sqlFile");
    }

    $sqlContent = file_get_contents($sqlFile);
    echo '[✓] SQL baseline file loaded ('.strlen($sqlContent)." bytes)\n";

    echo "Importing baseline schema...\n";
    $statements = [];
    $current = '';
    $inString = false;
    $stringChar = '';
    $escaped = false;
    $len = strlen($sqlContent);

    for ($i = 0; $i < $len; $i++) {
        $c = $sqlContent[$i];

        if ($escaped) {
            $current .= $c;
            $escaped = false;

            continue;
        }
        if ($c === '\\') {
            $current .= $c;
            $escaped = true;

            continue;
        }

        if (($c === "'" || $c === '"') && ! $inString) {
            $inString = true;
            $stringChar = $c;
        } elseif ($c === $stringChar && $inString) {
            $inString = false;
            $stringChar = '';
        }

        $current .= $c;

        if ($c === ';' && ! $inString) {
            $statements[] = $current;
            $current = '';
        }
    }
    if (trim($current) !== '') {
        $statements[] = $current;
    }

    $count = 0;
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (! empty($statement)) {
            try {
                $connection->exec($statement);
                $count++;
            } catch (Exception $e) {
                // Ignore warning errors on baseline creation
            }
        }
    }
    echo "[✓] Baseline import complete. Executed $count statements.\n";

    echo "Healing schema drifts in baseline tables...\n";
    try {
        $connection->exec("ALTER TABLE `lifestyles` ADD COLUMN `property` VARCHAR(191) NULL DEFAULT NULL AFTER `living_with`");
        echo "  Added missing 'property' column to 'lifestyles' table.\n";
    } catch (Exception $e) {
        // column already exists, ignore
    }

    echo "Pre-registering initial migrations to prevent creation conflicts...\n";
    $connection->exec('CREATE TABLE IF NOT EXISTS migrations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        migration VARCHAR(255) NOT NULL,
        batch INT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

    $initialMigrations = [
        '2014_10_12_000000_create_users_table',
        '2014_10_12_100000_create_password_resets_table',
        '2019_08_19_000000_create_failed_jobs_table',
        '2019_10_13_000000_create_social_credentials_table',
        '2019_12_14_000001_create_personal_access_tokens_table',
        '2021_03_03_064750_create_notifications_table',
        '2023_10_09_094817_create_manual_payment_methods_table',
    ];

    $stmt = $connection->prepare('INSERT INTO migrations (migration, batch) VALUES (:migration, 1)');
    foreach ($initialMigrations as $m) {
        // Check if already registered first
        $check = $connection->prepare('SELECT COUNT(*) FROM migrations WHERE migration = :m');
        $check->execute([':m' => $m]);
        if ($check->fetchColumn() == 0) {
            $stmt->execute([':migration' => $m]);
            echo "  Registered: $m\n";
        }
    }
    echo "[✓] Migration pre-registration complete\n";

} catch (Exception $e) {
    echo '[✗] Error: '.$e->getMessage()."\n";
    exit(1);
}

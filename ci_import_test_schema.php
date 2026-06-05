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
    if (!file_exists($sqlFile)) {
        throw new Exception("Baseline SQL file not found: $sqlFile");
    }

    $sqlContent = file_get_contents($sqlFile);
    echo "[✓] SQL baseline file loaded (".strlen($sqlContent)." bytes)\n";

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

        if (($c === "'" || $c === '"') && !$inString) {
            $inString = true;
            $stringChar = $c;
        } elseif ($c === $stringChar && $inString) {
            $inString = false;
            $stringChar = '';
        }

        $current .= $c;

        if ($c === ';' && !$inString) {
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
        if (!empty($statement)) {
            try {
                $connection->exec($statement);
                $count++;
            } catch (Exception $e) {
                // Ignore warning errors on baseline creation
            }
        }
    }
    echo "[✓] Baseline import complete. Executed $count statements.\n";

} catch (Exception $e) {
    echo "[✗] Error: ".$e->getMessage()."\n";
    exit(1);
}

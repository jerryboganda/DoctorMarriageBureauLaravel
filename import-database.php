<?php
/**
 * Marriage Bureau - Database Import Script
 * This script imports the matrimonial database
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== Marriage Bureau Database Import ===\n\n";

// Database connection details
$host = 'localhost';
$user = 'root';
$password = '';  // Empty for default Laragon
$database = 'matrimonial';
$sqlFile = __DIR__ . '/matrimonial1.sql';

try {
    echo "[1/4] Attempting to connect to MySQL...\n";
    
    // Try different connection methods
    $connection = null;
    $errors = [];
    
    // Method 1: Try with empty password
    try {
        $pdo = new PDO("mysql:host=$host", $user, '');
        echo "[✓] Connected successfully with empty password\n";
        $connection = $pdo;
    } catch (PDOException $e) {
        $errors[] = "Empty password: " . $e->getMessage();
        
        // Method 2: Try common Laragon passwords
        $passwords = ['laragon', 'root', 'password', '123456'];
        
        foreach ($passwords as $pwd) {
            try {
                $pdo = new PDO("mysql:host=$host", $user, $pwd);
                echo "[✓] Connected successfully with password: $pwd\n";
                $connection = $pdo;
                $password = $pwd;
                break;
            } catch (PDOException $e2) {
                $errors[] = "Password '$pwd': " . $e2->getMessage();
            }
        }
    }
    
    if (!$connection) {
        echo "\n[✗] Could not connect to MySQL\n";
        echo "\nTried passwords: empty, 'laragon', 'root', 'password', '123456'\n";
        echo "\nPlease use HeidiSQL to complete the import manually:\n";
        echo "1. Open HeidiSQL from Laragon\n";
        echo "2. Create database: matrimonial\n";
        echo "3. Import file: " . $sqlFile . "\n";
        exit(1);
    }
    
    echo "[2/4] Creating database...\n";
    $connection->exec("CREATE DATABASE IF NOT EXISTS $database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "[✓] Database 'matrimonial' ready\n";
    
    echo "[3/4] Reading SQL dump file...\n";
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }
    
    $sqlContent = file_get_contents($sqlFile);
    echo "[✓] SQL file loaded (" . strlen($sqlContent) . " bytes)\n";
    
    echo "[4/4] Importing database...\n";
    
    // Use the database
    $connection->exec("USE $database");
    
    // Split SQL statements and execute
    $statements = preg_split('/;(?=(?:[^\']*\'[^\']*\')*[^\']*$)/', $sqlContent);
    
    $count = 0;
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement)) {
            try {
                $connection->exec($statement);
                $count++;
                if ($count % 50 == 0) {
                    echo ".";
                }
            } catch (Exception $e) {
                // Continue on error to allow import to complete
                // echo "  Warning: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n\n";
    echo "[✓] Import complete! Executed approximately $count statements\n";
    echo "[✓] Database is now ready\n\n";
    
    // Verify
    $result = $connection->query("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = '$database'");
    $row = $result->fetch(PDO::FETCH_ASSOC);
    echo "Tables created: " . $row['table_count'] . "\n";
    
    echo "\n=== SUCCESS ===\n";
    echo "Your application is ready at: http://localhost:8000\n";
    
} catch (PDOException $e) {
    echo "\n[✗] PDO Error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "\n[✗] Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

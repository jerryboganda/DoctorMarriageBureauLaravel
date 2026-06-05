<?php

try {
    $pdo = new PDO('mysql:host=localhost;dbname=matrimonial', 'root', 'root');
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_NUM);
    echo "✓ Database connection successful!\n";
    echo '✓ Tables created: '.count($tables)."\n\n";

    if (count($tables) > 0) {
        echo "Sample tables:\n";
        foreach (array_slice($tables, 0, 10) as $row) {
            echo '  - '.$row[0]."\n";
        }
        echo "\n✓ Database import successful!\n";
        echo "✓ Your application is ready at: http://localhost:8000\n";
    } else {
        echo "⚠ No tables found. Import may have failed.\n";
    }
} catch (PDOException $e) {
    echo '✗ Error: '.$e->getMessage()."\n";
    exit(1);
}

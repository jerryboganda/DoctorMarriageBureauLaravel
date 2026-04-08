<?php
$pdo = new PDO("mysql:host=db;dbname=marriagebureau;charset=utf8mb4", "root", "MarriageBureauRootPass123!");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Re-insert the citizen entry that was accidentally deleted
$pdo->exec("INSERT INTO profile_option_values (`group`, value, label, sort_order, is_active) VALUES ('immigration_status', 'citizen', 'Citizen', 0, 1)");
echo "Inserted citizen entry\n";

// Verify
$stmt = $pdo->query("SELECT id, value, label FROM profile_option_values WHERE `group` = 'immigration_status' ORDER BY sort_order");
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo "  ID={$row['id']}, value='{$row['value']}', label='{$row['label']}'\n";
}
echo "Done!\n";

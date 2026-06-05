<?php

$sqlFile = 'complete_test_datallllllllllllllllllllllllllllllll.sql';
if (! file_exists($sqlFile)) {
    exit('File not found');
}

$handle = fopen($sqlFile, 'r');
if ($handle) {
    while (($line = fgets($handle)) !== false) {
        if (strpos($line, 'INSERT INTO `religions`') !== false) {
            echo $line;
            for ($i = 0; $i < 20; $i++) {
                echo fgets($handle);
            }
        }
        if (strpos($line, 'INSERT INTO `castes`') !== false) {
            echo $line;
            for ($i = 0; $i < 50; $i++) {
                echo fgets($handle);
            }
        }
    }
    fclose($handle);
}

<?php

/**
 * Simple script to view OTP logs from Laravel log file
 * Run this script to see the latest OTP verification codes
 */
$logFile = __DIR__.'/storage/logs/laravel.log';

if (! file_exists($logFile)) {
    echo "Log file not found: $logFile\n";
    exit(1);
}

echo "=== OTP VERIFICATION LOGS ===\n";
echo "Reading from: $logFile\n";
echo "Last 50 lines containing OTP information:\n\n";

// Read the last 50 lines of the log file
$lines = file($logFile);
$lastLines = array_slice($lines, -50);

$otpLines = [];
foreach ($lastLines as $line) {
    if (strpos($line, 'OTP') !== false ||
        strpos($line, 'Code for Testing') !== false ||
        strpos($line, 'verification_code') !== false ||
        strpos($line, 'SMS Code') !== false ||
        strpos($line, 'Email Code') !== false) {
        $otpLines[] = trim($line);
    }
}

if (empty($otpLines)) {
    echo "No OTP logs found in the last 50 lines.\n";
} else {
    foreach ($otpLines as $line) {
        echo $line."\n";
    }
}

echo "\n=== END OTP LOGS ===\n";
echo "To view real-time logs, run: tail -f storage/logs/laravel.log\n";

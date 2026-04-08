<?php
$host = '127.0.0.1';
$port = 6001;

echo "Checking Soketi at $host:$port...\n";

$connection = @fsockopen($host, $port, $errno, $errstr, 2);

if (is_resource($connection)) {
    echo "SUCCESS: Soketi is running and reachable on port $port.\n";
    fclose($connection);
} else {
    echo "FAILURE: Soketi is NOT running or NOT reachable on port $port.\n";
    echo "Error: $errstr ($errno)\n";
}

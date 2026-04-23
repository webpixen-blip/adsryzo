<?php
/**
 * Ad Delivery Endpoint
 * CORS-enabled for cross-origin fetching (Blogger, WordPress, etc.)
 */

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

$configFile = 'config.json';

if (!file_exists($configFile)) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Configuration file not found"]);
    exit;
}

$configData = json_decode(file_get_contents($configFile), true);

if (!$configData) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Invalid configuration data"]);
    exit;
}

// Return only the delivery details
echo json_encode([
    "status" => "success",
    "target_url" => $configData['target_url'],
    "image_url" => $configData['image_url']
]);
?>

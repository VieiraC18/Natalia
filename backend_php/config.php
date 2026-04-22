<?php
// config.php - Database Configuration

// In InfinityFree, these credentials are found in the Control Panel -> MySQL Details
define('DB_HOST', 'sql208.infinityfree.com');
define('DB_USER', 'if0_41054553');
define('DB_PASS', '38315360'); // A senha que você viu no painel
define('DB_NAME', 'if0_41054553_doctor'); // VERIFIQUE SE O NOME É EXATAMENTE ESTE NO PAINEL

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // In production, do not echo the error message to avoid leaking paths
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Function to handle CORS
function handleCors()
{
    // Replace * with your actual domain in production for better security
    // e.g., 'http://your-site.rf.gd'
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
?>
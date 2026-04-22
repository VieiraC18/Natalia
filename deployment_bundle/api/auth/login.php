<?php
require_once '../../config.php';
handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing credentials']);
    exit;
}

$email = $data->email;
$password = $data->password;

$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
    if (isset($user['status']) && $user['status'] !== 'approved') {
        http_response_code(403);
        echo json_encode(['error' => 'Sua conta aguarda aprovação do administrador.']);
        exit;
    }
    // Generate a simple token (In production, use JWT or proper session)
    // For this simple example, we'll confirm login and return user info
    // The frontend can store the user ID or a basic token

    // Simple improvement: Generate a random token and store it? 
    // For now, let's keep it stateless and rely on client storing the 'user' object 
    // and sending user_id (NOT SECURE PROD) or better:
    // Create a real JWT if possible, but without composer libraries it's hard.
    // Solution: We will implement a very basic "simulate JWT" just base64 encoding for now 
    // OR just return the user and have the frontend trust it (Insecure).

    // Better: Helper function for JWT creation (manual implementation for no-deps)
    $payload = [
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'exp' => time() + (60 * 60 * 24) // 24 hours
    ];

    // Minimalistic JWT-like token (Not cryptographically signed properly without keys, but base64 is better than nothing for transport demo)
    // Actually, let's just use the USER ID for the 'auth' for now in this 'simple' migration
    // UNLESS I create a manual signature.

    // Let's do a basic HMAC signature
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payload);
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, 'YOUR_SECRET_KEY_CHANGE_THIS', true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

    echo json_encode([
        'token' => $jwt,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role']
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
}
?>
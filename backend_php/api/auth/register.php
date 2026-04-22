<?php
require_once '../../config.php';
handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password) || !isset($data->name)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$email = filter_var($data->email, FILTER_SANITIZE_EMAIL);
$password = $data->password;
$name = htmlspecialchars($data->name);

// Check if user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->rowCount() > 0) {
    http_response_code(409);
    echo json_encode(['error' => 'Email already registered']);
    exit;
}

// Hash password
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// Insert user
try {
    $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, name, status) VALUES (?, ?, ?, 'pending')");
    $stmt->execute([$email, $passwordHash, $name]);

    $userId = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        'message' => 'User registered successfully',
        'user' => [
            'id' => $userId,
            'email' => $email,
            'name' => $name
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed']);
}
?>
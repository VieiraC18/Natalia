<?php
require_once '../config.php';
require_once '../auth_middleware.php';

handleCors();
$user = authenticate();
$userId = $user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM workplaces WHERE user_id = ? ORDER BY name ASC");
    $stmt->execute([$userId]);
    echo json_encode($stmt->fetchAll());
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nome é obrigatório']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO workplaces (user_id, name, address, default_payment) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $data->name, $data->address ?? '', $data->default_payment ?? 0]);
    echo json_encode(['id' => $pdo->lastInsertId(), 'message' => 'Local criado com sucesso']);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID missing']);
        exit;
    }
    // Security check: ensure workplace belongs to user
    $stmt = $pdo->prepare("DELETE FROM workplaces WHERE id = ? AND user_id = ?");
    $stmt->execute([$_GET['id'], $userId]);
    echo json_encode(['message' => 'Deleted']);
}
?>
<?php
require_once '../../config.php';
require_once '../../auth_middleware.php';

handleCors();
$user = authenticate();

// Only admin
if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $type = isset($_GET['type']) ? $_GET['type'] : 'pending';

    if ($type === 'all') {
        $stmt = $pdo->query("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC");
    } else {
        $stmt = $pdo->query("SELECT id, name, email, created_at FROM users WHERE status = 'pending' ORDER BY created_at DESC");
    }
    echo json_encode($stmt->fetchAll());

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Approve, Reject, Suspend, Delete, Promote?
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->user_id) || !isset($data->action)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    if ($data->action === 'approve') {
        $stmt = $pdo->prepare("UPDATE users SET status = 'approved' WHERE id = ?");
        $stmt->execute([$data->user_id]);
        echo json_encode(['message' => 'Usuário aprovado']);

    } elseif ($data->action === 'suspend') {
        $stmt = $pdo->prepare("UPDATE users SET status = 'suspended' WHERE id = ?");
        $stmt->execute([$data->user_id]);
        echo json_encode(['message' => 'Usuário suspenso']);

    } elseif ($data->action === 'reactivate') { // Un-suspend
        $stmt = $pdo->prepare("UPDATE users SET status = 'approved' WHERE id = ?");
        $stmt->execute([$data->user_id]);
        echo json_encode(['message' => 'Usuário reativado']);

    } elseif ($data->action === 'reject' || $data->action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$data->user_id]);
        echo json_encode(['message' => 'Usuário removido']);
    }
}
?>
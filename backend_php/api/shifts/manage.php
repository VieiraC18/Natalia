<?php
require_once '../../config.php';
require_once '../../auth_middleware.php';

handleCors();

$user = authenticate();
$userId = $user['id'];

$id = isset($_GET['id']) ? intval($_GET['id']) : null;

if (!$id) {
    // Try to get ID from URL path if rewritten
    // For now, explicit param is safer
    http_response_code(400);
    echo json_encode(['error' => 'Mission ID']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    try {
        // Verify ownership
        $check = $pdo->prepare("SELECT id FROM shifts WHERE id = ? AND user_id = ?");
        $check->execute([$id, $userId]);
        if ($check->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Shift not found']);
            exit;
        }

        $sql = "UPDATE shifts SET location_name=?, location_address=?, start_time=?, end_time=?, payment_amount=?, shift_type=?, notes=?, updated_at=NOW() WHERE id=? AND user_id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->location_name,
            $data->location_address,
            $data->start_time,
            $data->end_time,
            $data->payment_amount,
            $data->shift_type,
            $data->notes,
            $id,
            $userId
        ]);

        // Return updated
        $stmt = $pdo->prepare("SELECT * FROM shifts WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed']);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' || ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'delete')) {
    try {
        $stmt = $pdo->prepare("DELETE FROM shifts WHERE id = ?");
        // Remove user_id check if admin? For now keep user_id for safety unless admin logic added here too.
        // User asked: "Apagar o que foi adicionado".
        // Let's assume user deletes their own. Admin might delete others?
        // Let's keep user_id check for now unless they are admin.

        // Check if admin
        if ($user['role'] === 'admin') {
            $stmt = $pdo->prepare("DELETE FROM shifts WHERE id = ?");
            $stmt->execute([$id]);
        } else {
            $stmt = $pdo->prepare("DELETE FROM shifts WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
        }

        if ($stmt->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Shift not found or permission denied']);
        } else {
            echo json_encode(['message' => 'Deleted successfully']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Delete failed']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
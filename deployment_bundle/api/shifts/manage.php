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

        $sql = "UPDATE shifts SET location_name=?, location_address=?, start_time=?, end_time=?, payment_amount=?, tax_percentage=?, shift_type=?, notes=?, updated_at=NOW() WHERE id=? AND user_id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->location_name,
            $data->location_address,
            $data->start_time,
            $data->end_time,
            $data->payment_amount,
            isset($data->tax_percentage) ? $data->tax_percentage : 0,
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

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $stmt = $pdo->prepare("DELETE FROM shifts WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);

        if ($stmt->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Shift not found']);
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
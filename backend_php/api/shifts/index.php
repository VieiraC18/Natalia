<?php
require_once '../../config.php';
require_once '../../auth_middleware.php';

handleCors();

$user = authenticate();
$userId = $user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // List Shifts
    $sql = "SELECT * FROM shifts";
    $params = [];

    // If NOT admin, filter by user; If Admin, show all OR filter by specific user if requested
    if ($user['role'] !== 'admin') {
        $sql .= " WHERE user_id = ?";
        $params[] = $userId;
    } else {
        // Admin: Check if filtering by specific user
        if (isset($_GET['user_id'])) {
            $sql .= " WHERE user_id = ?";
            $params[] = $_GET['user_id'];
        } else {
            // Admin sees all, but we need to handle WHERE/AND logic for dates
            $sql .= " WHERE 1=1";
        }
    }

    if (isset($_GET['start']) && isset($_GET['end'])) {
        $sql .= " AND start_time >= ? AND end_time <= ?";
        $params[] = $_GET['start'];
        $params[] = $_GET['end'];
    }

    $sql .= " ORDER BY start_time ASC";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $shifts = $stmt->fetchAll();
        echo json_encode($shifts);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch shifts']);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create Shift
    $data = json_decode(file_get_contents("php://input"));

    // Validation
    if (!isset($data->start_time) || !isset($data->end_time)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO shifts (user_id, location_name, location_address, start_time, end_time, payment_amount, shift_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $userId,
            $data->location_name ?? 'Unknown',
            $data->location_address ?? '',
            str_replace('T', ' ', $data->start_time), // Fix: Remove T from datetime-local
            str_replace('T', ' ', $data->end_time),   // Fix: Remove T from datetime-local
            $data->payment_amount ?? 0,
            $data->shift_type ?? 'regular',
            $data->notes ?? ''
        ]);

        $newId = $pdo->lastInsertId();

        // Fetch the created shift
        $stmt = $pdo->prepare("SELECT * FROM shifts WHERE id = ?");
        $stmt->execute([$newId]);
        $newShift = $stmt->fetch();

        http_response_code(201);
        echo json_encode($newShift);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create shift: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
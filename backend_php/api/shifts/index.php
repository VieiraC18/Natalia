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
        $payment_type = $data->payment_type ?? 'fixed';
        $hourly_rate = $data->hourly_rate ?? 0;
        $worked_hours = $data->worked_hours ?? 0;
        $per_patient_rate = $data->per_patient_rate ?? 0;
        $estimated_patients = $data->estimated_patients ?? 0;
        $attended_patients = $data->attended_patients ?? 0;
        $return_patients = $data->return_patients ?? 0;
        $deduct_lunch = isset($data->deduct_lunch) && $data->deduct_lunch ? 1 : 0;
        
        $is_recurring = isset($data->is_recurring) && $data->is_recurring;
        $recurrence_end_date = $data->recurrence_end_date ?? null;
        
        // Helper func to insert a shift
        $insertShift = function($startDate, $endDate, $groupId) use ($pdo, $userId, $data, $payment_type, $hourly_rate, $worked_hours, $per_patient_rate, $estimated_patients, $attended_patients, $return_patients, $deduct_lunch) {
            $stmt = $pdo->prepare("INSERT INTO shifts (user_id, location_name, location_address, start_time, end_time, payment_amount, shift_type, payment_type, hourly_rate, worked_hours, per_patient_rate, estimated_patients, attended_patients, return_patients, deduct_lunch, recurrence_group_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $userId,
                $data->location_name ?? 'Unknown',
                $data->location_address ?? '',
                $startDate,
                $endDate,
                $data->payment_amount ?? 0,
                $data->shift_type ?? 'regular',
                $payment_type,
                $hourly_rate,
                $worked_hours,
                $per_patient_rate,
                $estimated_patients,
                $attended_patients,
                $return_patients,
                $deduct_lunch,
                $groupId,
                $data->notes ?? ''
            ]);
            return $pdo->lastInsertId();
        };

        $baseStart = str_replace('T', ' ', $data->start_time);
        $baseEnd = str_replace('T', ' ', $data->end_time);

        if ($is_recurring && $recurrence_end_date) {
            $groupId = uniqid('rec_');
            $currentStart = new DateTime($baseStart);
            $currentEnd = new DateTime($baseEnd);
            $limitDate = new DateTime($recurrence_end_date);
            $limitDate->setTime(23, 59, 59);

            $lastInsertedId = null;
            while ($currentStart <= $limitDate) {
                $lastInsertedId = $insertShift($currentStart->format('Y-m-d H:i:s'), $currentEnd->format('Y-m-d H:i:s'), $groupId);
                // Add 1 week
                $currentStart->modify('+7 days');
                $currentEnd->modify('+7 days');
            }
            $newId = $lastInsertedId; // Return the last one or maybe the first one. Let's return the last inserted to not break the frontend format.
        } else {
            $newId = $insertShift($baseStart, $baseEnd, null);
        }

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
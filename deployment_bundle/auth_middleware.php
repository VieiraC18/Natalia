<?php
// auth_middleware.php

if (!function_exists('getallheaders')) {
    function getallheaders()
    {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

function authenticate()
{
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

    if (!$authHeader && isset($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    }

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        exit;
    }

    $jwt = $matches[1];
    $tokenParts = explode('.', $jwt);

    if (count($tokenParts) != 3) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token format']);
        exit;
    }

    $header = base64_decode($tokenParts[0]);
    $payload = base64_decode($tokenParts[1]);
    $signatureProvided = $tokenParts[2];

    // Verify Signature
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, 'YOUR_SECRET_KEY_CHANGE_THIS', true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    if ($base64UrlSignature !== $signatureProvided) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid signature']);
        exit;
    }

    $decodedPayload = json_decode($payload, true);
    if ($decodedPayload['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['error' => 'Token expired']);
        exit;
    }

    return $decodedPayload;
}
?>
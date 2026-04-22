<?php
// create_custom_admin.php - Executar uma vez para criar o Administrador Master
require 'config.php';

$email = 'caiovieirac@gmail.com';
$password = 'C@io18071997@';
$name = 'Administrador Caio';
$role = 'admin';
$status = 'approved';

// Hash da senha
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Verificar se já existe
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $check->execute([$email]);

    if ($check->rowCount() > 0) {
        $stmt = $pdo->prepare("UPDATE users SET password_hash=?, role=?, status=?, name=? WHERE email=?");
        $stmt->execute([$passwordHash, $role, $status, $name, $email]);
        echo "<h1>Usuário Admin ATUALIZADO com sucesso!</h1>";
    } else {
        $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$email, $passwordHash, $name, $role, $status]);
        echo "<h1>Usuário Admin CRIADO com sucesso!</h1>";
    }

    echo "<p>Email: $email</p>";
    echo "<p>Status: $status</p>";
    echo "<p style='color:red'>APAGUE ESTE ARQUIVO DEPOIS DE USAR!</p>";

} catch (PDOException $e) {
    echo "<h1>Erro</h1>" . $e->getMessage();
}
?>
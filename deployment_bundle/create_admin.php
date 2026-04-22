<?php
// create_admin.php - Execute uma vez e APAGUE este arquivo depois!

require 'config.php';

// Edite aqui se quiser outros dados
$email = 'admin@doctorapp.com';
$password = 'admin123'; // Senha simples para começar
$name = 'Administrador';

// Gera o hash seguro da senha
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Verifica se já existe
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $check->execute([$email]);

    if ($check->rowCount() > 0) {
        echo "<h1>Erro!</h1> O usuário <b>$email</b> já existe no banco de dados.";
    } else {
        // Cria o usuário
        $sql = "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$email, $passwordHash, $name]);

        echo "<h1>Sucesso!</h1>";
        echo "<p>Usuário criado com sucesso:</p>";
        echo "<ul>";
        echo "<li><b>Email:</b> $email</li>";
        echo "<li><b>Senha:</b> $password</li>";
        echo "</ul>";
        echo "<p style='color: red; font-weight: bold;'>AGORA APAGUE ESTE ARQUIVO DO SERVIDOR PARA SUA SEGURANÇA!</p>";
        echo "<a href='/'>Ir para o Login</a>";
    }
} catch (PDOException $e) {
    echo "Erro no banco de dados: " . $e->getMessage();
}
?>
<?php
// test_db.php - Upload para htdocs e acesse pelo navegador
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Teste de Conexão com Banco de Dados</h1>";

if (!file_exists('config.php')) {
    die("<p style='color:red'>Erro: Arquivo config.php não encontrado na mesma pasta!</p>");
}

require 'config.php';

try {
    echo "<p>Tentando conectar em <strong>" . DB_HOST . "</strong>...</p>";

    // Teste simples de query
    $stmt = $pdo->query("SELECT 'Conexão OK' as status");
    $result = $stmt->fetch();

    echo "<h2 style='color:green'>SUCESSO: " . $result['status'] . "</h2>";
    echo "<p>Banco de dados selecionado: " . DB_NAME . "</p>";

    // Listar tabelas
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "<h3>Tabelas Encontradas:</h3><ul>";
    if (empty($tables)) {
        echo "<li>Nenhuma tabela encontrada (banco vazio).</li>";
    } else {
        foreach ($tables as $table) {
            echo "<li>$table</li>";
        }
    }
    echo "</ul>";

} catch (PDOException $e) {
    echo "<h2 style='color:red'>FALHA NA CONEXÃO</h2>";
    echo "<p>Erro detalhado:</p>";
    echo "<pre>" . $e->getMessage() . "</pre>";
    echo "<hr>";
    echo "<p>Verifique se:</p>";
    echo "<ul>";
    echo "<li>O Host está correto (sql208...)</li>";
    echo "<li>A senha contém espaços extras?</li>";
    echo "<li>O nome do banco está exato?</li>";
    echo "</ul>";
}
?>
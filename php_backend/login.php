<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));

if(isset($data->email) && isset($data->password)) {
    $email = $conn->real_escape_string($data->email);
    $password = $data->password;

    $query = "SELECT id, name, password_hash FROM users WHERE email = '$email'";
    $result = $conn->query($query);

    if($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if(password_verify($password, $user['password_hash'])) {
            // In a real app, generate a JWT token here
            echo json_encode([
                "status" => "success", 
                "message" => "Login successful!",
                "user" => [
                    "id" => $user['id'],
                    "name" => $user['name'],
                    "email" => $email
                ]
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid password."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "User not found."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid input data."]);
}

$conn->close();
?>

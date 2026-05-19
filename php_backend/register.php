<?php
require_once 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));

if(isset($data->name) && isset($data->email) && isset($data->password)) {
    $name = $conn->real_escape_string($data->name);
    $email = $conn->real_escape_string($data->email);
    $password = $data->password;

    // Check if email already exists
    $check_query = "SELECT id FROM users WHERE email = '$email'";
    $result = $conn->query($check_query);
    if($result->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "Email already registered."]);
        exit();
    }

    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    $insert_query = "INSERT INTO users (name, email, password_hash) VALUES ('$name', '$email', '$hashed_password')";
    
    if($conn->query($insert_query) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Registration successful!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Error creating user: " . $conn->error]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid input data."]);
}

$conn->close();
?>

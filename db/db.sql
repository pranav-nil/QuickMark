CREATE DATABASE IF NOT EXISTS diglab;
USE diglab;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(255),
  author VARCHAR(255),
  link VARCHAR(255),
  status ENUM('reading', 'completed') DEFAULT 'reading',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

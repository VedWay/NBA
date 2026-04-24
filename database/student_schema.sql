CREATE DATABASE IF NOT EXISTS vjtiachievements;
USE vjtiachievements;

CREATE TABLE departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  dept_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE years (
  year_id INT AUTO_INCREMENT PRIMARY KEY,
  year_name VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE students (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  roll_no VARCHAR(20) UNIQUE,
  department_id INT,
  year_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(department_id),
  FOREIGN KEY (year_id) REFERENCES years(year_id)
);

CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE
);

CREATE TABLE achievements (
  achievement_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  category_id INT,
  title VARCHAR(255) NOT NULL,
  level VARCHAR(50),
  position VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  approved_by INT,
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id),
  FOREIGN KEY (approved_by) REFERENCES admins(admin_id)
);

CREATE TABLE files (
  file_id INT AUTO_INCREMENT PRIMARY KEY,
  achievement_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id)
);

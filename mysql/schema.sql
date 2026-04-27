-- NBA Accreditation Faculty Information System (MySQL 8+)
-- Run this file in your local MySQL server.

CREATE DATABASE IF NOT EXISTS nba_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nba_portal;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  auth_user_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'faculty', 'viewer') NOT NULL DEFAULT 'viewer',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_auth_user_id (auth_user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS faculty (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  photo_url TEXT NULL,
  cv_url TEXT NULL,
  linkedin_url TEXT NULL,
  github_url TEXT NULL,
  google_scholar_url TEXT NULL,
  website_url TEXT NULL,
  research_area TEXT NULL,
  bio TEXT NULL,
  experience_teaching INT NOT NULL DEFAULT 0,
  experience_industry INT NOT NULL DEFAULT 0,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_faculty_user_id (user_id),
  KEY idx_faculty_is_approved (is_approved),
  CONSTRAINT fk_faculty_user FOREIGN KEY (user_id) REFERENCES users(auth_user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS qualifications (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NULL,
  institute VARCHAR(255) NOT NULL,
  year INT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_qualifications_faculty (faculty_id, is_approved),
  CONSTRAINT fk_qualifications_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS publications (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  authors TEXT NULL,
  journal TEXT NULL,
  year INT NULL,
  doi VARCHAR(255) NULL,
  type VARCHAR(100) NULL,
  indexed VARCHAR(100) NULL,
  reference_url TEXT NULL,
  pdf_url TEXT NULL,
  scopus TINYINT(1) NOT NULL DEFAULT 0,
  wos TINYINT(1) NOT NULL DEFAULT 0,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_publications_faculty (faculty_id, is_approved),
  CONSTRAINT fk_publications_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fdp (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  role VARCHAR(100) NULL,
  duration VARCHAR(100) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  organized_by VARCHAR(255) NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fdp_faculty (faculty_id, is_approved),
  CONSTRAINT fk_fdp_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  funding_agency VARCHAR(255) NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  year INT NULL,
  status VARCHAR(100) NULL,
  reference_url TEXT NULL,
  pdf_url TEXT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_projects_faculty (faculty_id, is_approved),
  CONSTRAINT fk_projects_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS consultancy (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  company VARCHAR(255) NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  year INT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_consultancy_faculty (faculty_id, is_approved),
  CONSTRAINT fk_consultancy_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS patents (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  status VARCHAR(100) NULL,
  year INT NULL,
  number VARCHAR(100) NULL,
  reference_url TEXT NULL,
  pdf_url TEXT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_patents_faculty (faculty_id, is_approved),
  CONSTRAINT fk_patents_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS books (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  publisher VARCHAR(255) NULL,
  isbn VARCHAR(100) NULL,
  year INT NULL,
  reference_url TEXT NULL,
  pdf_url TEXT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_books_faculty (faculty_id, is_approved),
  CONSTRAINT fk_books_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS collaborations (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  organization VARCHAR(255) NULL,
  country VARCHAR(100) NULL,
  role VARCHAR(100) NULL,
  start_year INT NULL,
  end_year INT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_collaborations_faculty (faculty_id, is_approved),
  CONSTRAINT fk_collaborations_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS miscellaneous_items (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  reference_url TEXT NULL,
  pdf_url TEXT NULL,
  custom_fields JSON NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_misc_items_faculty (faculty_id, is_approved),
  CONSTRAINT fk_misc_items_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS awards (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  membership TEXT NULL,
  honors TEXT NULL,
  contributions TEXT NULL,
  year INT NULL,
  description TEXT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_awards_faculty (faculty_id, is_approved),
  CONSTRAINT fk_awards_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS moocs (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  course VARCHAR(255) NOT NULL,
  platform VARCHAR(255) NULL,
  grade VARCHAR(100) NULL,
  year INT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_moocs_faculty (faculty_id, is_approved),
  CONSTRAINT fk_moocs_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS research_proofs (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  proof_url TEXT NOT NULL,
  description TEXT NULL,
  year INT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_research_proofs_faculty (faculty_id, is_approved),
  CONSTRAINT fk_research_proofs_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) NOT NULL,
  recipient_user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_recipient (recipient_user_id, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (recipient_user_id) REFERENCES users(auth_user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS latest_achievements (
  id CHAR(36) NOT NULL,
  faculty_id CHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NULL,
  media_type ENUM('image', 'pdf', 'youtube', 'link') NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  published_from DATETIME NULL,
  published_to DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_latest_achievements_display (display_order, created_at),
  CONSTRAINT fk_latest_achievements_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT NOT NULL AUTO_INCREMENT,
  table_name VARCHAR(64) NOT NULL,
  row_id CHAR(36) NULL,
  action VARCHAR(16) NOT NULL,
  changed_by CHAR(36) NULL,
  old_data JSON NULL,
  new_data JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_log_lookup (table_name, row_id, created_at)
) ENGINE=InnoDB;

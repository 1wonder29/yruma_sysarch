-- SQL script to add certificates table to existing database
-- Run this in your MySQL/MariaDB database

-- Create the certificates table
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resident_id` int(11) NOT NULL,
  `certificate_type` varchar(50) NOT NULL,
  `serial_number` varchar(100) NOT NULL,
  `purpose` text DEFAULT NULL,
  `issue_date` date NOT NULL,
  `place_issued` varchar(150) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `serial_number` (`serial_number`),
  KEY `resident_id` (`resident_id`),
  CONSTRAINT `certificates_ibfk_1` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- SQL script to add Chairman and Secretary roles to users table
-- Run this in your MySQL/MariaDB database

-- Alter the users table to add Chairman and Secretary roles
ALTER TABLE `users` 
MODIFY COLUMN `role` enum('Admin','Staff','Chairman','Secretary') DEFAULT 'Staff';

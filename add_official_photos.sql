-- SQL script to add photo_path field to officials table
-- Run this in your MySQL/MariaDB database

-- Add photo_path column to officials table
ALTER TABLE `officials` 
ADD COLUMN `photo_path` varchar(255) DEFAULT NULL AFTER `signature_path`;

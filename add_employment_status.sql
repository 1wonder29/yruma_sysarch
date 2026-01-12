-- SQL script to add employment_status field to residents table
-- Run this in your MySQL/MariaDB database

-- Add employment_status column to residents table
ALTER TABLE `residents` 
ADD COLUMN `employment_status` enum('Working','Not Working') DEFAULT 'Not Working' AFTER `contact_no`;

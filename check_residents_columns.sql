-- Check current columns in residents table
SHOW COLUMNS FROM residents;

-- If citizenship column doesn't exist, add it:
-- ALTER TABLE `residents` 
-- ADD COLUMN `citizenship` VARCHAR(50) DEFAULT 'Filipino' AFTER `address`;

-- If employment_status column doesn't exist, add it:
-- ALTER TABLE `residents` 
-- ADD COLUMN `employment_status` ENUM('Working','Not Working') DEFAULT 'Not Working' AFTER `contact_no`;

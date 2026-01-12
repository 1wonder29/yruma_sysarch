-- Add complainant_name column to incidents table
-- This allows recording the name of the person who reported the incident
-- even if they are not registered as a resident in the system

ALTER TABLE `incidents` 
ADD COLUMN `complainant_name` VARCHAR(255) DEFAULT NULL AFTER `complainant_id`;

-- Ensure columns are LONGTEXT for larger images/GIFs
ALTER TABLE usuarios MODIFY COLUMN foto LONGTEXT;
ALTER TABLE usuarios MODIFY COLUMN home_left_image LONGTEXT;
ALTER TABLE usuarios MODIFY COLUMN home_right_image LONGTEXT;
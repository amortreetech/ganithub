-- GanitHub Seed Data
-- Sample data for testing and demonstration

-- Insert sample users
INSERT INTO users (first_name, last_name, email, password_hash, role, grade_level, created_at) VALUES
('Demo', 'Student', 'demo@ganithub.com', '$2b$10$example_hash_for_demo', 'student', '5', NOW()),
('Admin', 'User', 'admin@ganithub.com', '$2b$10$example_hash_for_admin', 'admin', NULL, NOW()),
('Ms. Sarah', 'Teacher', 'tutor@ganithub.com', '$2b$10$example_hash_for_tutor', 'tutor', NULL, NOW()),
('Alex', 'Chen', 'alex@example.com', '$2b$10$example_hash', 'student', '5', NOW()),
('Sarah', 'Johnson', 'sarah@example.com', '$2b$10$example_hash', 'student', '6', NOW()),
('Ms. Emily', 'Wilson', 'emily@example.com', '$2b$10$example_hash', 'tutor', NULL, NOW()),
('John', 'Smith', 'john@example.com', '$2b$10$example_hash', 'parent', NULL, NOW()),
('Mike', 'Wilson', 'mike@example.com', '$2b$10$example_hash', 'student', '4', NOW()),
('Emma', 'Davis', 'emma@example.com', '$2b$10$example_hash', 'student', '7', NOW()),
('Mr. David', 'Brown', 'david@example.com', '$2b$10$example_hash', 'tutor', NULL, NOW());

-- Insert sample live classes
INSERT INTO live_classes (title, description, tutor_id, scheduled_time, duration_minutes, max_students, meeting_room, status, created_at) VALUES
('Multiplication Basics', 'Learn the fundamentals of multiplication with fun examples', 3, '2024-01-15 10:00:00', 45, 20, 'math-multiplication-basics', 'scheduled', NOW()),
('Fraction Operations', 'Understanding fractions through visual methods', 6, '2024-01-15 14:00:00', 60, 15, 'math-fractions-101', 'scheduled', NOW()),
('Geometry Fundamentals', 'Exploring shapes and their properties', 3, '2024-01-16 09:00:00', 50, 25, 'geometry-basics', 'scheduled', NOW()),
('Algebra Introduction', 'First steps into algebraic thinking', 10, '2024-01-16 15:00:00', 55, 18, 'algebra-intro', 'scheduled', NOW()),
('Problem Solving Strategies', 'Techniques for tackling word problems', 6, '2024-01-17 11:00:00', 40, 22, 'problem-solving', 'scheduled', NOW());

-- Insert sample class enrollments
INSERT INTO class_enrollments (class_id, student_id, enrolled_at) VALUES
(1, 1, NOW()),
(1, 4, NOW()),
(1, 5, NOW()),
(2, 1, NOW()),
(2, 9, NOW()),
(3, 4, NOW()),
(3, 5, NOW()),
(3, 8, NOW()),
(4, 9, NOW()),
(5, 1, NOW()),
(5, 4, NOW());

-- Insert sample recorded videos
INSERT INTO recorded_videos (title, description, file_path, thumbnail_path, duration_seconds, category, difficulty_level, tutor_id, created_at) VALUES
('Introduction to Addition', 'Basic addition concepts for beginners', '/videos/addition-intro.mp4', '/thumbnails/addition-intro.jpg', 480, 'Arithmetic', 'Easy', 3, NOW()),
('Subtraction Made Simple', 'Learn subtraction with visual aids', '/videos/subtraction-basics.mp4', '/thumbnails/subtraction-basics.jpg', 520, 'Arithmetic', 'Easy', 6, NOW()),
('Multiplication Tables', 'Memorizing multiplication tables 1-12', '/videos/multiplication-tables.mp4', '/thumbnails/multiplication-tables.jpg', 720, 'Arithmetic', 'Medium', 3, NOW()),
('Division Strategies', 'Different approaches to division problems', '/videos/division-strategies.mp4', '/thumbnails/division-strategies.jpg', 650, 'Arithmetic', 'Medium', 10, NOW()),
('Fraction Basics', 'Understanding what fractions represent', '/videos/fraction-basics.mp4', '/thumbnails/fraction-basics.jpg', 580, 'Fractions', 'Medium', 6, NOW()),
('Decimal Operations', 'Working with decimal numbers', '/videos/decimal-operations.mp4', '/thumbnails/decimal-operations.jpg', 690, 'Decimals', 'Hard', 10, NOW()),
('Basic Geometry Shapes', 'Identifying and properties of shapes', '/videos/geometry-shapes.mp4', '/thumbnails/geometry-shapes.jpg', 450, 'Geometry', 'Easy', 3, NOW()),
('Area and Perimeter', 'Calculating area and perimeter of shapes', '/videos/area-perimeter.mp4', '/thumbnails/area-perimeter.jpg', 780, 'Geometry', 'Medium', 6, NOW());

-- Insert sample tests
INSERT INTO tests (title, description, difficulty_level, time_limit_minutes, total_questions, category, created_by, created_at) VALUES
('Basic Addition Quiz', 'Test your addition skills', 'Easy', 10, 5, 'Arithmetic', 2, NOW()),
('Multiplication Challenge', 'Multiplication problems for grade 5', 'Medium', 15, 8, 'Arithmetic', 2, NOW()),
('Fraction Fundamentals', 'Understanding fractions', 'Medium', 20, 10, 'Fractions', 2, NOW()),
('Geometry Basics Test', 'Shapes and their properties', 'Easy', 12, 6, 'Geometry', 2, NOW()),
('Advanced Problem Solving', 'Complex word problems', 'Hard', 25, 12, 'Problem Solving', 2, NOW());

-- Insert sample test questions
INSERT INTO test_questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
-- Basic Addition Quiz
(1, 'What is 15 + 27?', '32', '42', '52', '62', 'B', '15 + 27 = 42'),
(1, 'What is 8 + 9?', '16', '17', '18', '19', 'B', '8 + 9 = 17'),
(1, 'What is 25 + 13?', '38', '39', '37', '36', 'A', '25 + 13 = 38'),
(1, 'What is 44 + 28?', '72', '71', '73', '70', 'A', '44 + 28 = 72'),
(1, 'What is 19 + 16?', '34', '35', '36', '33', 'B', '19 + 16 = 35'),

-- Multiplication Challenge
(2, 'What is 7 × 8?', '54', '56', '58', '52', 'B', '7 × 8 = 56'),
(2, 'What is 9 × 6?', '54', '56', '52', '58', 'A', '9 × 6 = 54'),
(2, 'What is 12 × 7?', '84', '82', '86', '88', 'A', '12 × 7 = 84'),
(2, 'What is 8 × 9?', '71', '72', '73', '74', 'B', '8 × 9 = 72'),
(2, 'What is 11 × 6?', '66', '64', '68', '62', 'A', '11 × 6 = 66'),
(2, 'What is 7 × 12?', '84', '82', '86', '88', 'A', '7 × 12 = 84'),
(2, 'What is 9 × 8?', '71', '72', '73', '74', 'B', '9 × 8 = 72'),
(2, 'What is 6 × 7?', '42', '40', '44', '46', 'A', '6 × 7 = 42');

-- Insert sample test attempts
INSERT INTO test_attempts (test_id, student_id, score, total_questions, time_taken_minutes, completed_at) VALUES
(1, 1, 5, 5, 8, NOW() - INTERVAL 2 HOUR),
(1, 4, 4, 5, 9, NOW() - INTERVAL 1 DAY),
(2, 1, 7, 8, 12, NOW() - INTERVAL 5 HOUR),
(2, 5, 6, 8, 14, NOW() - INTERVAL 2 DAY),
(3, 9, 8, 10, 18, NOW() - INTERVAL 1 DAY),
(4, 4, 5, 6, 10, NOW() - INTERVAL 3 HOUR),
(4, 8, 6, 6, 11, NOW() - INTERVAL 1 DAY);

-- Insert sample gamification data
INSERT INTO user_coins (user_id, total_coins, coins_earned, coins_spent) VALUES
(1, 450, 500, 50),
(4, 320, 350, 30),
(5, 280, 300, 20),
(8, 150, 150, 0),
(9, 380, 400, 20);

-- Insert sample badges
INSERT INTO badges (name, description, icon, criteria, coin_reward) VALUES
('First Test', 'Complete your first test', 'trophy', 'Complete 1 test', 10),
('Math Champ', 'Score 100% on any test', 'star', 'Score 100% on a test', 50),
('Consistent Learner', 'Take tests for 7 consecutive days', 'calendar', 'Daily activity for 7 days', 100),
('Video Watcher', 'Watch 10 complete videos', 'play', 'Watch 10 videos to completion', 30),
('Class Attendee', 'Attend 5 live classes', 'users', 'Attend 5 live classes', 75),
('Problem Solver', 'Complete 50 test questions', 'brain', 'Answer 50 questions correctly', 80);

-- Insert sample user badges
INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES
(1, 1, NOW() - INTERVAL 10 DAY),
(1, 2, NOW() - INTERVAL 8 DAY),
(1, 4, NOW() - INTERVAL 5 DAY),
(1, 5, NOW() - INTERVAL 3 DAY),
(1, 6, NOW() - INTERVAL 1 DAY),
(4, 1, NOW() - INTERVAL 7 DAY),
(4, 4, NOW() - INTERVAL 4 DAY),
(5, 1, NOW() - INTERVAL 6 DAY),
(5, 2, NOW() - INTERVAL 2 DAY),
(9, 1, NOW() - INTERVAL 5 DAY);

-- Insert sample leaderboard entries
INSERT INTO leaderboard (user_id, total_score, tests_completed, rank_position, week_start) VALUES
(1, 850, 12, 3, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)),
(9, 920, 15, 1, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)),
(5, 780, 10, 5, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)),
(4, 890, 14, 2, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)),
(8, 650, 8, 8, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY));

-- Insert sample attendance records
INSERT INTO attendance (class_id, student_id, attended_at, duration_minutes) VALUES
(1, 1, NOW() - INTERVAL 2 DAY, 45),
(1, 4, NOW() - INTERVAL 2 DAY, 40),
(2, 1, NOW() - INTERVAL 1 DAY, 60),
(2, 9, NOW() - INTERVAL 1 DAY, 55),
(3, 4, NOW() - INTERVAL 1 DAY, 50),
(3, 5, NOW() - INTERVAL 1 DAY, 48),
(3, 8, NOW() - INTERVAL 1 DAY, 45);

-- Insert sample video progress
INSERT INTO video_progress (video_id, student_id, watch_time_seconds, completed, last_watched) VALUES
(1, 1, 480, TRUE, NOW() - INTERVAL 3 DAY),
(2, 1, 520, TRUE, NOW() - INTERVAL 2 DAY),
(3, 1, 360, FALSE, NOW() - INTERVAL 1 DAY),
(1, 4, 480, TRUE, NOW() - INTERVAL 4 DAY),
(4, 4, 650, TRUE, NOW() - INTERVAL 2 DAY),
(5, 9, 580, TRUE, NOW() - INTERVAL 1 DAY),
(6, 9, 345, FALSE, NOW() - INTERVAL 1 HOUR);

-- Insert sample parent-child relationships
INSERT INTO parent_child_relationships (parent_id, child_id, relationship_type, created_at) VALUES
(7, 8, 'father', NOW() - INTERVAL 30 DAY),
(7, 1, 'guardian', NOW() - INTERVAL 25 DAY);

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES
(1, 'New Class Available', 'Geometry Fundamentals class is now open for enrollment', 'class', FALSE, NOW() - INTERVAL 2 HOUR),
(1, 'Test Completed', 'You scored 7/8 on the Multiplication Challenge!', 'test', TRUE, NOW() - INTERVAL 5 HOUR),
(1, 'Badge Earned', 'Congratulations! You earned the Problem Solver badge', 'achievement', FALSE, NOW() - INTERVAL 1 DAY),
(4, 'Class Reminder', 'Multiplication Basics class starts in 30 minutes', 'reminder', TRUE, NOW() - INTERVAL 30 MINUTE),
(9, 'New Video', 'Area and Perimeter video has been added to your curriculum', 'content', FALSE, NOW() - INTERVAL 1 HOUR);

-- Update user statistics
UPDATE users SET 
    total_coins = (SELECT COALESCE(total_coins, 0) FROM user_coins WHERE user_id = users.id),
    tests_completed = (SELECT COUNT(*) FROM test_attempts WHERE student_id = users.id),
    classes_attended = (SELECT COUNT(*) FROM attendance WHERE student_id = users.id),
    last_login = NOW() - INTERVAL FLOOR(RAND() * 168) HOUR
WHERE role = 'student';

-- Insert sample system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('platform_name', 'GanitHub', 'Name of the platform'),
('max_class_size', '25', 'Maximum students per class'),
('test_time_limit', '30', 'Default test time limit in minutes'),
('coin_per_test', '10', 'Coins awarded per completed test'),
('coin_per_class', '15', 'Coins awarded per attended class'),
('badge_multiplier', '2', 'Coin multiplier for badge achievements');

-- Create some sample content categories
INSERT INTO content_categories (name, description, color_code) VALUES
('Arithmetic', 'Basic mathematical operations', '#3B82F6'),
('Fractions', 'Working with parts of a whole', '#10B981'),
('Geometry', 'Shapes, space, and measurement', '#8B5CF6'),
('Decimals', 'Decimal number operations', '#F59E0B'),
('Problem Solving', 'Word problems and logical thinking', '#EF4444'),
('Algebra', 'Introduction to algebraic concepts', '#6366F1');

COMMIT;


-- GanitHub Database Schema
-- EdTech platform for kids learning mathematics

-- Create database
CREATE DATABASE IF NOT EXISTS ganithub_db;
USE ganithub_db;

-- Users table (Admin, Student, Tutor, Parent)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student', 'tutor', 'parent') NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    grade_level INT, -- For students (1-8)
    profile_picture VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Parent-Student relationship table
CREATE TABLE parent_student_relations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NOT NULL,
    student_id INT NOT NULL,
    relationship_type ENUM('father', 'mother', 'guardian') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_parent_student (parent_id, student_id)
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subjects table
CREATE TABLE subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    grade_level INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topics table (within subjects)
CREATE TABLE topics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Live classes table
CREATE TABLE live_classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INT NOT NULL,
    topic_id INT,
    tutor_id INT NOT NULL,
    class_type ENUM('one_on_one', 'group') NOT NULL,
    max_students INT DEFAULT 1,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    jitsi_room_id VARCHAR(255),
    meeting_password VARCHAR(100),
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    grade_level INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (tutor_id) REFERENCES users(id)
);

-- Class enrollments
CREATE TABLE class_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('enrolled', 'attended', 'missed', 'cancelled') DEFAULT 'enrolled',
    FOREIGN KEY (class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (class_id, student_id)
);

-- Attendance tracking
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    duration_minutes INT DEFAULT 0,
    attendance_status ENUM('present', 'absent', 'late', 'partial') DEFAULT 'absent',
    marked_by INT, -- Admin override
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id),
    UNIQUE KEY unique_attendance (class_id, student_id)
);

-- Recorded videos table
CREATE TABLE recorded_videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INT NOT NULL,
    topic_id INT,
    tutor_id INT NOT NULL,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration_seconds INT DEFAULT 0,
    file_size_mb DECIMAL(10,2),
    grade_level INT NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    view_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (tutor_id) REFERENCES users(id)
);

-- Video watch progress
CREATE TABLE video_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL,
    student_id INT NOT NULL,
    watch_time_seconds INT DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (video_id) REFERENCES recorded_videos(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_progress (video_id, student_id)
);

-- Tests/Quizzes table
CREATE TABLE tests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INT NOT NULL,
    topic_id INT,
    created_by INT NOT NULL,
    grade_level INT NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    total_questions INT DEFAULT 0,
    time_limit_minutes INT DEFAULT 30,
    passing_score DECIMAL(5,2) DEFAULT 60.00,
    max_attempts INT DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Test questions table
CREATE TABLE test_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    test_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('mcq', 'true_false', 'fill_blank') DEFAULT 'mcq',
    option_a VARCHAR(500),
    option_b VARCHAR(500),
    option_c VARCHAR(500),
    option_d VARCHAR(500),
    correct_answer CHAR(1) NOT NULL, -- A, B, C, D for MCQ; T, F for true/false
    explanation TEXT,
    points DECIMAL(5,2) DEFAULT 1.00,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

-- Test attempts table
CREATE TABLE test_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    test_id INT NOT NULL,
    student_id INT NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    time_taken_minutes INT DEFAULT 0,
    score DECIMAL(5,2) DEFAULT 0.00,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Test answers table
CREATE TABLE test_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer CHAR(1),
    is_correct BOOLEAN DEFAULT FALSE,
    points_earned DECIMAL(5,2) DEFAULT 0.00,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_answer (attempt_id, question_id)
);

-- Gamification: Coins table
CREATE TABLE user_coins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    coins_earned INT NOT NULL DEFAULT 0,
    coins_spent INT NOT NULL DEFAULT 0,
    current_balance INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_coins (user_id)
);

-- Coin transactions table
CREATE TABLE coin_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    transaction_type ENUM('earned', 'spent') NOT NULL,
    amount INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference_type ENUM('test_completion', 'class_attendance', 'video_completion', 'daily_login', 'streak_bonus', 'purchase') NOT NULL,
    reference_id INT, -- ID of test, class, video, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Badges table
CREATE TABLE badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    badge_type ENUM('achievement', 'milestone', 'streak', 'special') DEFAULT 'achievement',
    criteria_type ENUM('test_score', 'attendance', 'video_completion', 'login_streak', 'total_coins') NOT NULL,
    criteria_value INT NOT NULL, -- Threshold value
    coins_reward INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User badges table
CREATE TABLE user_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_value INT DEFAULT 0, -- Current progress towards badge
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id)
);

-- Leaderboard table (computed/cached data)
CREATE TABLE leaderboard (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    leaderboard_type ENUM('weekly_coins', 'monthly_coins', 'test_scores', 'attendance') NOT NULL,
    score INT NOT NULL DEFAULT 0,
    rank_position INT NOT NULL DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_leaderboard_entry (user_id, leaderboard_type, period_start)
);

-- Notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('class_reminder', 'test_available', 'badge_earned', 'general') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    reference_type VARCHAR(50), -- 'class', 'test', 'badge', etc.
    reference_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System settings table
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_live_classes_tutor ON live_classes(tutor_id);
CREATE INDEX idx_live_classes_scheduled ON live_classes(scheduled_at);
CREATE INDEX idx_attendance_class_student ON attendance(class_id, student_id);
CREATE INDEX idx_video_progress_student ON video_progress(student_id);
CREATE INDEX idx_test_attempts_student ON test_attempts(student_id);
CREATE INDEX idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_leaderboard_type_period ON leaderboard(leaderboard_type, period_start, period_end);


const bcrypt = require('bcryptjs');
const { insert, findOne } = require('../config/database');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Hash password for all test users
        const hashedPassword = await bcrypt.hash('password123', 12);

        // Create admin user
        console.log('Creating admin user...');
        const adminResult = await insert(`
            INSERT INTO users (email, password, first_name, last_name, role)
            VALUES (?, ?, ?, ?, ?)
        `, ['admin@ganithub.com', hashedPassword, 'Admin', 'User', 'admin']);

        // Create tutor users
        console.log('Creating tutor users...');
        const tutor1Result = await insert(`
            INSERT INTO users (email, password, first_name, last_name, role, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        `, ['tutor1@ganithub.com', hashedPassword, 'Sarah', 'Johnson', 'tutor', '+1234567890']);

        const tutor2Result = await insert(`
            INSERT INTO users (email, password, first_name, last_name, role, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        `, ['tutor2@ganithub.com', hashedPassword, 'Michael', 'Chen', 'tutor', '+1234567891']);

        // Create student users
        console.log('Creating student users...');
        const students = [
            { email: 'student1@ganithub.com', firstName: 'Emma', lastName: 'Wilson', dob: '2015-03-15' },
            { email: 'student2@ganithub.com', firstName: 'Liam', lastName: 'Brown', dob: '2014-07-22' },
            { email: 'student3@ganithub.com', firstName: 'Olivia', lastName: 'Davis', dob: '2013-11-08' },
            { email: 'student4@ganithub.com', firstName: 'Noah', lastName: 'Miller', dob: '2016-01-30' },
            { email: 'student5@ganithub.com', firstName: 'Ava', lastName: 'Garcia', dob: '2015-09-12' }
        ];

        const studentIds = [];
        for (const student of students) {
            const result = await insert(`
                INSERT INTO users (email, password, first_name, last_name, role, date_of_birth)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [student.email, hashedPassword, student.firstName, student.lastName, 'student', student.dob]);
            
            studentIds.push(result.insertId);

            // Initialize coins for each student
            await insert(`
                INSERT INTO user_coins (user_id, total_coins)
                VALUES (?, ?)
            `, [result.insertId, Math.floor(Math.random() * 100) + 50]); // Random coins between 50-150
        }

        // Create parent users
        console.log('Creating parent users...');
        const parents = [
            { email: 'parent1@ganithub.com', firstName: 'Jennifer', lastName: 'Wilson' },
            { email: 'parent2@ganithub.com', firstName: 'David', lastName: 'Brown' },
            { email: 'parent3@ganithub.com', firstName: 'Lisa', lastName: 'Davis' }
        ];

        const parentIds = [];
        for (const parent of parents) {
            const result = await insert(`
                INSERT INTO users (email, password, first_name, last_name, role, phone)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [parent.email, hashedPassword, parent.firstName, parent.lastName, 'parent', '+1234567892']);
            
            parentIds.push(result.insertId);
        }

        // Link parents to students
        console.log('Linking parents to students...');
        await insert(`
            INSERT INTO parent_student_relations (parent_id, student_id, relationship_type)
            VALUES (?, ?, ?)
        `, [parentIds[0], studentIds[0], 'parent']); // Jennifer -> Emma

        await insert(`
            INSERT INTO parent_student_relations (parent_id, student_id, relationship_type)
            VALUES (?, ?, ?)
        `, [parentIds[1], studentIds[1], 'parent']); // David -> Liam

        await insert(`
            INSERT INTO parent_student_relations (parent_id, student_id, relationship_type)
            VALUES (?, ?, ?)
        `, [parentIds[2], studentIds[2], 'parent']); // Lisa -> Olivia

        // Create sample classes
        console.log('Creating sample classes...');
        const classes = [
            {
                title: 'Basic Addition and Subtraction',
                description: 'Learn fundamental addition and subtraction concepts',
                tutorId: tutor1Result.insertId,
                classType: 'live',
                ageGroup: '7-9',
                difficultyLevel: 'easy',
                topic: 'Arithmetic',
                scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                jitsiRoomId: 'ganithub-basic-addition'
            },
            {
                title: 'Multiplication Tables',
                description: 'Master multiplication tables 1-12',
                tutorId: tutor2Result.insertId,
                classType: 'live',
                ageGroup: '10-12',
                difficultyLevel: 'medium',
                topic: 'Multiplication',
                scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
                jitsiRoomId: 'ganithub-multiplication'
            },
            {
                title: 'Introduction to Fractions',
                description: 'Understanding fractions and basic operations',
                tutorId: tutor1Result.insertId,
                classType: 'recorded',
                ageGroup: '10-12',
                difficultyLevel: 'medium',
                topic: 'Fractions'
            }
        ];

        const classIds = [];
        for (const classData of classes) {
            const result = await insert(`
                INSERT INTO classes (title, description, tutor_id, class_type, max_students, 
                                   age_group, difficulty_level, topic, scheduled_at, 
                                   duration_minutes, jitsi_room_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                classData.title, classData.description, classData.tutorId, classData.classType,
                10, classData.ageGroup, classData.difficultyLevel, classData.topic,
                classData.scheduledAt || null, 60, classData.jitsiRoomId || null
            ]);
            
            classIds.push(result.insertId);
        }

        // Enroll students in classes
        console.log('Enrolling students in classes...');
        for (let i = 0; i < Math.min(studentIds.length, 3); i++) {
            await insert(`
                INSERT INTO class_enrollments (class_id, student_id)
                VALUES (?, ?)
            `, [classIds[0], studentIds[i]]);
        }

        // Create sample recorded videos
        console.log('Creating sample recorded videos...');
        const videos = [
            {
                title: 'Counting Numbers 1-100',
                description: 'Learn to count from 1 to 100 with fun animations',
                tutorId: tutor1Result.insertId,
                videoUrl: '/uploads/videos/counting-1-100.mp4',
                thumbnailUrl: '/uploads/thumbnails/counting-1-100.jpg',
                topic: 'Counting',
                ageGroup: '7-9',
                difficultyLevel: 'easy',
                durationSeconds: 900
            },
            {
                title: 'Shapes and Geometry Basics',
                description: 'Introduction to basic shapes and their properties',
                tutorId: tutor2Result.insertId,
                videoUrl: '/uploads/videos/shapes-geometry.mp4',
                thumbnailUrl: '/uploads/thumbnails/shapes-geometry.jpg',
                topic: 'Geometry',
                ageGroup: '7-9',
                difficultyLevel: 'easy',
                durationSeconds: 1200
            }
        ];

        for (const video of videos) {
            await insert(`
                INSERT INTO recorded_videos (title, description, tutor_id, video_url, 
                                           thumbnail_url, duration_seconds, topic, age_group, 
                                           difficulty_level, view_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                video.title, video.description, video.tutorId, video.videoUrl,
                video.thumbnailUrl, video.durationSeconds, video.topic, video.ageGroup,
                video.difficultyLevel, Math.floor(Math.random() * 50) + 10
            ]);
        }

        // Create sample tests
        console.log('Creating sample tests...');
        const test1Result = await insert(`
            INSERT INTO tests (title, description, created_by, topic, age_group, 
                             difficulty_level, total_questions, time_limit_minutes, 
                             passing_score, coins_reward)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'Basic Addition Quiz',
            'Test your addition skills with numbers 1-20',
            tutor1Result.insertId,
            'Addition',
            '7-9',
            'easy',
            5,
            10,
            60,
            15
        ]);

        // Create test questions
        const questions = [
            { question: 'What is 5 + 3?', a: '6', b: '7', c: '8', d: '9', correct: 'c' },
            { question: 'What is 12 + 7?', a: '18', b: '19', c: '20', d: '21', correct: 'b' },
            { question: 'What is 9 + 4?', a: '12', b: '13', c: '14', d: '15', correct: 'b' },
            { question: 'What is 15 + 6?', a: '20', b: '21', c: '22', d: '23', correct: 'b' },
            { question: 'What is 8 + 8?', a: '14', b: '15', c: '16', d: '17', correct: 'c' }
        ];

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            await insert(`
                INSERT INTO test_questions (test_id, question_text, option_a, option_b, 
                                          option_c, option_d, correct_answer, question_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [test1Result.insertId, q.question, q.a, q.b, q.c, q.d, q.correct, i + 1]);
        }

        // Create some test attempts
        console.log('Creating sample test attempts...');
        for (let i = 0; i < 3; i++) {
            const score = Math.floor(Math.random() * 40) + 60; // Score between 60-100
            const correctAnswers = Math.floor((score / 100) * 5);
            
            await insert(`
                INSERT INTO test_attempts (test_id, student_id, score, total_questions, 
                                         correct_answers, time_taken_minutes, coins_earned)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [test1Result.insertId, studentIds[i], score, 5, correctAnswers, 
                Math.floor(Math.random() * 5) + 3, score >= 60 ? 15 : 0]);
        }

        // Award some coins and badges
        console.log('Creating coin transactions and badges...');
        for (let i = 0; i < studentIds.length; i++) {
            // Add some coin transactions
            await insert(`
                INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description)
                VALUES (?, ?, ?, ?, ?)
            `, [studentIds[i], 15, 'earned', 'test_completion', 'Completed Basic Addition Quiz']);

            await insert(`
                INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description)
                VALUES (?, ?, ?, ?, ?)
            `, [studentIds[i], 5, 'earned', 'class_attendance', 'Attended Basic Addition class']);

            // Award some badges
            if (i < 2) {
                await insert(`
                    INSERT INTO user_badges (user_id, badge_id)
                    VALUES (?, ?)
                `, [studentIds[i], 1]); // Math Champ badge
            }
        }

        console.log('✅ Database seeding completed successfully!');
        console.log('\n📋 Test Accounts Created:');
        console.log('Admin: admin@ganithub.com / password123');
        console.log('Tutor 1: tutor1@ganithub.com / password123');
        console.log('Tutor 2: tutor2@ganithub.com / password123');
        console.log('Student 1: student1@ganithub.com / password123');
        console.log('Student 2: student2@ganithub.com / password123');
        console.log('Parent 1: parent1@ganithub.com / password123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };


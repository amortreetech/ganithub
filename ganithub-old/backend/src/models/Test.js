const { executeQuery } = require('../config/database');

class Test {
  constructor(testData) {
    this.id = testData.id;
    this.title = testData.title;
    this.description = testData.description;
    this.subject_id = testData.subject_id;
    this.topic_id = testData.topic_id;
    this.created_by = testData.created_by;
    this.grade_level = testData.grade_level;
    this.difficulty_level = testData.difficulty_level;
    this.total_questions = testData.total_questions;
    this.time_limit_minutes = testData.time_limit_minutes;
    this.passing_score = testData.passing_score;
    this.max_attempts = testData.max_attempts;
    this.is_active = testData.is_active;
    this.created_at = testData.created_at;
    this.updated_at = testData.updated_at;
  }

  // Create a new test
  static async create(testData) {
    try {
      const query = `
        INSERT INTO tests (
          title, description, subject_id, topic_id, created_by,
          grade_level, difficulty_level, time_limit_minutes, 
          passing_score, max_attempts
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        testData.title,
        testData.description || null,
        testData.subject_id,
        testData.topic_id || null,
        testData.created_by,
        testData.grade_level,
        testData.difficulty_level || 'easy',
        testData.time_limit_minutes || 30,
        testData.passing_score || 60.00,
        testData.max_attempts || 3
      ];

      const result = await executeQuery(query, values);
      return await Test.findById(result.insertId);
    } catch (error) {
      throw new Error(`Error creating test: ${error.message}`);
    }
  }

  // Find test by ID
  static async findById(id) {
    try {
      const query = `
        SELECT t.*, 
               s.name as subject_name,
               tp.name as topic_name,
               u.first_name as creator_first_name,
               u.last_name as creator_last_name
        FROM tests t
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN topics tp ON t.topic_id = tp.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.id = ?
      `;
      
      const results = await executeQuery(query, [id]);
      return results.length > 0 ? new Test(results[0]) : null;
    } catch (error) {
      throw new Error(`Error finding test by ID: ${error.message}`);
    }
  }

  // Get all tests with filters
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT t.*, 
               s.name as subject_name,
               tp.name as topic_name,
               u.first_name as creator_first_name,
               u.last_name as creator_last_name
        FROM tests t
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN topics tp ON t.topic_id = tp.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.is_active = TRUE
      `;
      
      const values = [];
      
      if (filters.grade_level) {
        query += ' AND t.grade_level = ?';
        values.push(filters.grade_level);
      }
      
      if (filters.difficulty_level) {
        query += ' AND t.difficulty_level = ?';
        values.push(filters.difficulty_level);
      }
      
      if (filters.subject_id) {
        query += ' AND t.subject_id = ?';
        values.push(filters.subject_id);
      }
      
      if (filters.created_by) {
        query += ' AND t.created_by = ?';
        values.push(filters.created_by);
      }
      
      query += ' ORDER BY t.created_at DESC';
      
      if (filters.limit) {
        query += ' LIMIT ?';
        values.push(parseInt(filters.limit));
      }
      
      const results = await executeQuery(query, values);
      return results.map(testData => new Test(testData));
    } catch (error) {
      throw new Error(`Error finding tests: ${error.message}`);
    }
  }

  // Add question to test
  async addQuestion(questionData) {
    try {
      const query = `
        INSERT INTO test_questions (
          test_id, question_text, question_type, option_a, option_b,
          option_c, option_d, correct_answer, explanation, points, order_index
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        this.id,
        questionData.question_text,
        questionData.question_type || 'mcq',
        questionData.option_a || null,
        questionData.option_b || null,
        questionData.option_c || null,
        questionData.option_d || null,
        questionData.correct_answer,
        questionData.explanation || null,
        questionData.points || 1.00,
        questionData.order_index || 0
      ];

      const result = await executeQuery(query, values);
      
      // Update total questions count
      await this.updateQuestionCount();
      
      return result.insertId;
    } catch (error) {
      throw new Error(`Error adding question: ${error.message}`);
    }
  }

  // Get test questions
  async getQuestions(includeAnswers = false) {
    try {
      let query = `
        SELECT id, question_text, question_type, option_a, option_b,
               option_c, option_d, points, order_index
      `;
      
      if (includeAnswers) {
        query += `, correct_answer, explanation`;
      }
      
      query += `
        FROM test_questions 
        WHERE test_id = ? 
        ORDER BY order_index ASC, id ASC
      `;
      
      const results = await executeQuery(query, [this.id]);
      return results;
    } catch (error) {
      throw new Error(`Error getting test questions: ${error.message}`);
    }
  }

  // Update question count
  async updateQuestionCount() {
    try {
      const countQuery = `SELECT COUNT(*) as count FROM test_questions WHERE test_id = ?`;
      const countResult = await executeQuery(countQuery, [this.id]);
      
      const updateQuery = `
        UPDATE tests SET total_questions = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      await executeQuery(updateQuery, [countResult[0].count, this.id]);
      this.total_questions = countResult[0].count;
      
      return true;
    } catch (error) {
      throw new Error(`Error updating question count: ${error.message}`);
    }
  }

  // Start test attempt
  static async startAttempt(testId, studentId) {
    try {
      // Check if student has remaining attempts
      const attemptsQuery = `
        SELECT COUNT(*) as attempts FROM test_attempts 
        WHERE test_id = ? AND student_id = ?
      `;
      const attemptsResult = await executeQuery(attemptsQuery, [testId, studentId]);
      
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }
      
      if (attemptsResult[0].attempts >= test.max_attempts) {
        throw new Error('Maximum attempts exceeded');
      }
      
      // Create new attempt
      const attemptQuery = `
        INSERT INTO test_attempts (
          test_id, student_id, attempt_number, started_at, status
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'in_progress')
      `;
      
      const attemptNumber = attemptsResult[0].attempts + 1;
      const result = await executeQuery(attemptQuery, [testId, studentId, attemptNumber]);
      
      return {
        attempt_id: result.insertId,
        attempt_number: attemptNumber,
        time_limit_minutes: test.time_limit_minutes
      };
    } catch (error) {
      throw new Error(`Error starting test attempt: ${error.message}`);
    }
  }

  // Submit answer
  static async submitAnswer(attemptId, questionId, selectedAnswer) {
    try {
      // Get correct answer and points
      const questionQuery = `
        SELECT correct_answer, points FROM test_questions WHERE id = ?
      `;
      const questionResult = await executeQuery(questionQuery, [questionId]);
      
      if (questionResult.length === 0) {
        throw new Error('Question not found');
      }
      
      const question = questionResult[0];
      const isCorrect = selectedAnswer === question.correct_answer;
      const pointsEarned = isCorrect ? question.points : 0;
      
      // Insert or update answer
      const answerQuery = `
        INSERT INTO test_answers (
          attempt_id, question_id, selected_answer, is_correct, points_earned
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          selected_answer = VALUES(selected_answer),
          is_correct = VALUES(is_correct),
          points_earned = VALUES(points_earned),
          answered_at = CURRENT_TIMESTAMP
      `;
      
      await executeQuery(answerQuery, [
        attemptId, questionId, selectedAnswer, isCorrect, pointsEarned
      ]);
      
      return { isCorrect, pointsEarned };
    } catch (error) {
      throw new Error(`Error submitting answer: ${error.message}`);
    }
  }

  // Complete test attempt
  static async completeAttempt(attemptId) {
    try {
      // Calculate total score
      const scoreQuery = `
        SELECT 
          SUM(ta.points_earned) as total_score,
          SUM(tq.points) as max_possible_score,
          COUNT(ta.id) as answered_questions,
          t.total_questions
        FROM test_attempts tat
        JOIN tests t ON tat.test_id = t.id
        LEFT JOIN test_answers ta ON tat.id = ta.attempt_id
        LEFT JOIN test_questions tq ON ta.question_id = tq.id
        WHERE tat.id = ?
        GROUP BY tat.id, t.total_questions
      `;
      
      const scoreResult = await executeQuery(scoreQuery, [attemptId]);
      
      if (scoreResult.length === 0) {
        throw new Error('Test attempt not found');
      }
      
      const score = scoreResult[0];
      const totalScore = score.total_score || 0;
      const maxScore = score.max_possible_score || 0;
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      
      // Calculate time taken
      const timeQuery = `
        SELECT TIMESTAMPDIFF(MINUTE, started_at, NOW()) as time_taken
        FROM test_attempts WHERE id = ?
      `;
      const timeResult = await executeQuery(timeQuery, [attemptId]);
      const timeTaken = timeResult[0].time_taken;
      
      // Update attempt with final results
      const updateQuery = `
        UPDATE test_attempts 
        SET completed_at = CURRENT_TIMESTAMP,
            time_taken_minutes = ?,
            score = ?,
            percentage = ?,
            status = 'completed'
        WHERE id = ?
      `;
      
      await executeQuery(updateQuery, [timeTaken, totalScore, percentage, attemptId]);
      
      return {
        score: totalScore,
        max_score: maxScore,
        percentage: percentage,
        time_taken: timeTaken,
        answered_questions: score.answered_questions,
        total_questions: score.total_questions
      };
    } catch (error) {
      throw new Error(`Error completing test attempt: ${error.message}`);
    }
  }

  // Get student's test attempts
  static async getStudentAttempts(testId, studentId) {
    try {
      const query = `
        SELECT * FROM test_attempts 
        WHERE test_id = ? AND student_id = ?
        ORDER BY attempt_number DESC
      `;
      
      const results = await executeQuery(query, [testId, studentId]);
      return results;
    } catch (error) {
      throw new Error(`Error getting student attempts: ${error.message}`);
    }
  }

  // Get test results/statistics
  async getResults() {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT ta.student_id) as total_students,
          COUNT(ta.id) as total_attempts,
          AVG(ta.percentage) as avg_percentage,
          MAX(ta.percentage) as max_percentage,
          MIN(ta.percentage) as min_percentage,
          AVG(ta.time_taken_minutes) as avg_time_taken
        FROM test_attempts ta
        WHERE ta.test_id = ? AND ta.status = 'completed'
      `;
      
      const results = await executeQuery(query, [this.id]);
      return results[0];
    } catch (error) {
      throw new Error(`Error getting test results: ${error.message}`);
    }
  }

  // Get leaderboard for test
  async getLeaderboard(limit = 10) {
    try {
      const query = `
        SELECT 
          u.first_name, u.last_name, u.id as student_id,
          MAX(ta.percentage) as best_percentage,
          MIN(ta.time_taken_minutes) as best_time,
          COUNT(ta.id) as attempts_count
        FROM test_attempts ta
        JOIN users u ON ta.student_id = u.id
        WHERE ta.test_id = ? AND ta.status = 'completed'
        GROUP BY ta.student_id, u.first_name, u.last_name
        ORDER BY best_percentage DESC, best_time ASC
        LIMIT ?
      `;
      
      const results = await executeQuery(query, [this.id, limit]);
      return results;
    } catch (error) {
      throw new Error(`Error getting test leaderboard: ${error.message}`);
    }
  }

  // Update test
  async update(updateData) {
    try {
      const allowedFields = [
        'title', 'description', 'time_limit_minutes', 
        'passing_score', 'max_attempts', 'is_active'
      ];
      
      const updateFields = [];
      const values = [];
      
      for (const field of allowedFields) {
        if (updateData.hasOwnProperty(field)) {
          updateFields.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      values.push(this.id);
      
      const query = `
        UPDATE tests 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await executeQuery(query, values);
      return await Test.findById(this.id);
    } catch (error) {
      throw new Error(`Error updating test: ${error.message}`);
    }
  }

  // Delete test
  async delete() {
    try {
      // Check if test has any attempts
      const attemptsQuery = `SELECT COUNT(*) as count FROM test_attempts WHERE test_id = ?`;
      const attemptsResult = await executeQuery(attemptsQuery, [this.id]);
      
      if (attemptsResult[0].count > 0) {
        // Soft delete - deactivate instead of hard delete
        await this.update({ is_active: false });
        return true;
      }
      
      // Hard delete if no attempts
      const query = `DELETE FROM tests WHERE id = ?`;
      await executeQuery(query, [this.id]);
      return true;
    } catch (error) {
      throw new Error(`Error deleting test: ${error.message}`);
    }
  }
}

module.exports = Test;


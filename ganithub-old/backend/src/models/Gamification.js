const { executeQuery } = require('../config/database');

class Gamification {
  // Award coins to user
  static async awardCoins(userId, amount, reason, referenceType, referenceId = null) {
    try {
      // Start transaction
      await executeQuery('START TRANSACTION');
      
      // Insert coin transaction
      const transactionQuery = `
        INSERT INTO coin_transactions (
          user_id, transaction_type, amount, reason, reference_type, reference_id
        ) VALUES (?, 'earned', ?, ?, ?, ?)
      `;
      
      await executeQuery(transactionQuery, [userId, amount, reason, referenceType, referenceId]);
      
      // Update user coin balance
      const updateBalanceQuery = `
        INSERT INTO user_coins (user_id, coins_earned, current_balance)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          coins_earned = coins_earned + VALUES(coins_earned),
          current_balance = current_balance + VALUES(coins_earned)
      `;
      
      await executeQuery(updateBalanceQuery, [userId, amount, amount]);
      
      // Commit transaction
      await executeQuery('COMMIT');
      
      // Check for badge achievements
      await Gamification.checkBadgeAchievements(userId);
      
      return true;
    } catch (error) {
      await executeQuery('ROLLBACK');
      throw new Error(`Error awarding coins: ${error.message}`);
    }
  }

  // Spend coins
  static async spendCoins(userId, amount, reason, referenceType, referenceId = null) {
    try {
      // Check current balance
      const balanceQuery = `SELECT current_balance FROM user_coins WHERE user_id = ?`;
      const balanceResult = await executeQuery(balanceQuery, [userId]);
      
      if (balanceResult.length === 0 || balanceResult[0].current_balance < amount) {
        throw new Error('Insufficient coin balance');
      }
      
      // Start transaction
      await executeQuery('START TRANSACTION');
      
      // Insert coin transaction
      const transactionQuery = `
        INSERT INTO coin_transactions (
          user_id, transaction_type, amount, reason, reference_type, reference_id
        ) VALUES (?, 'spent', ?, ?, ?, ?)
      `;
      
      await executeQuery(transactionQuery, [userId, amount, reason, referenceType, referenceId]);
      
      // Update user coin balance
      const updateBalanceQuery = `
        UPDATE user_coins 
        SET coins_spent = coins_spent + ?, current_balance = current_balance - ?
        WHERE user_id = ?
      `;
      
      await executeQuery(updateBalanceQuery, [amount, amount, userId]);
      
      // Commit transaction
      await executeQuery('COMMIT');
      
      return true;
    } catch (error) {
      await executeQuery('ROLLBACK');
      throw new Error(`Error spending coins: ${error.message}`);
    }
  }

  // Get user coin balance and history
  static async getUserCoins(userId) {
    try {
      const balanceQuery = `
        SELECT coins_earned, coins_spent, current_balance, last_updated
        FROM user_coins WHERE user_id = ?
      `;
      
      const balanceResult = await executeQuery(balanceQuery, [userId]);
      
      const historyQuery = `
        SELECT transaction_type, amount, reason, reference_type, reference_id, created_at
        FROM coin_transactions 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 20
      `;
      
      const historyResult = await executeQuery(historyQuery, [userId]);
      
      return {
        balance: balanceResult.length > 0 ? balanceResult[0] : {
          coins_earned: 0,
          coins_spent: 0,
          current_balance: 0,
          last_updated: null
        },
        recent_transactions: historyResult
      };
    } catch (error) {
      throw new Error(`Error getting user coins: ${error.message}`);
    }
  }

  // Create badge
  static async createBadge(badgeData) {
    try {
      const query = `
        INSERT INTO badges (
          name, description, icon_url, badge_type, criteria_type, 
          criteria_value, coins_reward, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        badgeData.name,
        badgeData.description || null,
        badgeData.icon_url || null,
        badgeData.badge_type || 'achievement',
        badgeData.criteria_type,
        badgeData.criteria_value,
        badgeData.coins_reward || 0,
        badgeData.is_active !== false
      ];
      
      const result = await executeQuery(query, values);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating badge: ${error.message}`);
    }
  }

  // Check badge achievements for user
  static async checkBadgeAchievements(userId) {
    try {
      // Get all active badges
      const badgesQuery = `
        SELECT * FROM badges WHERE is_active = TRUE
      `;
      const badges = await executeQuery(badgesQuery);
      
      for (const badge of badges) {
        // Check if user already has this badge
        const userBadgeQuery = `
          SELECT id FROM user_badges 
          WHERE user_id = ? AND badge_id = ? AND is_completed = TRUE
        `;
        const existingBadge = await executeQuery(userBadgeQuery, [userId, badge.id]);
        
        if (existingBadge.length > 0) {
          continue; // User already has this badge
        }
        
        let currentValue = 0;
        
        // Calculate current progress based on criteria type
        switch (badge.criteria_type) {
          case 'test_score':
            const testScoreQuery = `
              SELECT MAX(percentage) as max_score 
              FROM test_attempts 
              WHERE student_id = ? AND status = 'completed'
            `;
            const testScoreResult = await executeQuery(testScoreQuery, [userId]);
            currentValue = testScoreResult[0]?.max_score || 0;
            break;
            
          case 'attendance':
            const attendanceQuery = `
              SELECT COUNT(*) as count 
              FROM attendance 
              WHERE student_id = ? AND attendance_status = 'present'
            `;
            const attendanceResult = await executeQuery(attendanceQuery, [userId]);
            currentValue = attendanceResult[0]?.count || 0;
            break;
            
          case 'video_completion':
            const videoQuery = `
              SELECT COUNT(*) as count 
              FROM video_progress 
              WHERE student_id = ? AND completed = TRUE
            `;
            const videoResult = await executeQuery(videoQuery, [userId]);
            currentValue = videoResult[0]?.count || 0;
            break;
            
          case 'total_coins':
            const coinsQuery = `
              SELECT coins_earned FROM user_coins WHERE user_id = ?
            `;
            const coinsResult = await executeQuery(coinsQuery, [userId]);
            currentValue = coinsResult[0]?.coins_earned || 0;
            break;
            
          case 'login_streak':
            // This would require a separate login tracking table
            // For now, we'll skip this implementation
            continue;
        }
        
        // Update or create user badge progress
        const updateProgressQuery = `
          INSERT INTO user_badges (user_id, badge_id, progress_value, is_completed)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            progress_value = VALUES(progress_value),
            is_completed = VALUES(is_completed),
            earned_at = CASE WHEN VALUES(is_completed) = TRUE AND is_completed = FALSE 
                           THEN CURRENT_TIMESTAMP ELSE earned_at END
        `;
        
        const isCompleted = currentValue >= badge.criteria_value;
        await executeQuery(updateProgressQuery, [userId, badge.id, currentValue, isCompleted]);
        
        // Award coins if badge is newly completed
        if (isCompleted && badge.coins_reward > 0) {
          const checkNewBadgeQuery = `
            SELECT earned_at FROM user_badges 
            WHERE user_id = ? AND badge_id = ? AND is_completed = TRUE
            AND earned_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
          `;
          const newBadgeResult = await executeQuery(checkNewBadgeQuery, [userId, badge.id]);
          
          if (newBadgeResult.length > 0) {
            await Gamification.awardCoins(
              userId, 
              badge.coins_reward, 
              `Badge earned: ${badge.name}`, 
              'badge_earned', 
              badge.id
            );
          }
        }
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error checking badge achievements: ${error.message}`);
    }
  }

  // Get user badges
  static async getUserBadges(userId) {
    try {
      const query = `
        SELECT b.*, ub.progress_value, ub.is_completed, ub.earned_at
        FROM badges b
        LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
        WHERE b.is_active = TRUE
        ORDER BY ub.is_completed DESC, ub.earned_at DESC, b.name ASC
      `;
      
      const results = await executeQuery(query, [userId]);
      return results;
    } catch (error) {
      throw new Error(`Error getting user badges: ${error.message}`);
    }
  }

  // Get leaderboard
  static async getLeaderboard(type = 'weekly_coins', limit = 10) {
    try {
      let query;
      let values = [limit];
      
      switch (type) {
        case 'weekly_coins':
          query = `
            SELECT u.id, u.first_name, u.last_name, u.grade_level,
                   COALESCE(SUM(ct.amount), 0) as total_coins
            FROM users u
            LEFT JOIN coin_transactions ct ON u.id = ct.user_id 
              AND ct.transaction_type = 'earned'
              AND ct.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            WHERE u.role = 'student' AND u.is_active = TRUE
            GROUP BY u.id, u.first_name, u.last_name, u.grade_level
            ORDER BY total_coins DESC
            LIMIT ?
          `;
          break;
          
        case 'monthly_coins':
          query = `
            SELECT u.id, u.first_name, u.last_name, u.grade_level,
                   COALESCE(SUM(ct.amount), 0) as total_coins
            FROM users u
            LEFT JOIN coin_transactions ct ON u.id = ct.user_id 
              AND ct.transaction_type = 'earned'
              AND ct.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            WHERE u.role = 'student' AND u.is_active = TRUE
            GROUP BY u.id, u.first_name, u.last_name, u.grade_level
            ORDER BY total_coins DESC
            LIMIT ?
          `;
          break;
          
        case 'test_scores':
          query = `
            SELECT u.id, u.first_name, u.last_name, u.grade_level,
                   COALESCE(AVG(ta.percentage), 0) as avg_score,
                   COUNT(ta.id) as tests_taken
            FROM users u
            LEFT JOIN test_attempts ta ON u.id = ta.student_id 
              AND ta.status = 'completed'
            WHERE u.role = 'student' AND u.is_active = TRUE
            GROUP BY u.id, u.first_name, u.last_name, u.grade_level
            HAVING tests_taken > 0
            ORDER BY avg_score DESC, tests_taken DESC
            LIMIT ?
          `;
          break;
          
        case 'attendance':
          query = `
            SELECT u.id, u.first_name, u.last_name, u.grade_level,
                   COUNT(a.id) as classes_attended,
                   COALESCE(AVG(a.duration_minutes), 0) as avg_duration
            FROM users u
            LEFT JOIN attendance a ON u.id = a.student_id 
              AND a.attendance_status = 'present'
            WHERE u.role = 'student' AND u.is_active = TRUE
            GROUP BY u.id, u.first_name, u.last_name, u.grade_level
            HAVING classes_attended > 0
            ORDER BY classes_attended DESC, avg_duration DESC
            LIMIT ?
          `;
          break;
          
        default:
          throw new Error('Invalid leaderboard type');
      }
      
      const results = await executeQuery(query, values);
      
      // Add rank to results
      return results.map((user, index) => ({
        ...user,
        rank: index + 1
      }));
    } catch (error) {
      throw new Error(`Error getting leaderboard: ${error.message}`);
    }
  }

  // Award coins for specific activities
  static async awardActivityCoins(userId, activityType, referenceId = null) {
    try {
      const coinRules = {
        'test_completion': { amount: 10, reason: 'Test completed' },
        'class_attendance': { amount: 5, reason: 'Class attended' },
        'video_completion': { amount: 3, reason: 'Video completed' },
        'daily_login': { amount: 2, reason: 'Daily login bonus' },
        'perfect_score': { amount: 20, reason: 'Perfect test score' },
        'streak_bonus': { amount: 15, reason: 'Learning streak bonus' }
      };
      
      const rule = coinRules[activityType];
      if (!rule) {
        throw new Error('Invalid activity type');
      }
      
      // Check for duplicate awards (prevent gaming the system)
      if (referenceId) {
        const duplicateQuery = `
          SELECT id FROM coin_transactions 
          WHERE user_id = ? AND reference_type = ? AND reference_id = ?
        `;
        const duplicateResult = await executeQuery(duplicateQuery, [userId, activityType, referenceId]);
        
        if (duplicateResult.length > 0) {
          return false; // Already awarded for this activity
        }
      }
      
      await Gamification.awardCoins(userId, rule.amount, rule.reason, activityType, referenceId);
      return true;
    } catch (error) {
      throw new Error(`Error awarding activity coins: ${error.message}`);
    }
  }

  // Get gamification statistics
  static async getStatistics() {
    try {
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM user_coins WHERE current_balance > 0) as active_users,
          (SELECT SUM(current_balance) FROM user_coins) as total_coins_in_circulation,
          (SELECT COUNT(*) FROM user_badges WHERE is_completed = TRUE) as total_badges_earned,
          (SELECT COUNT(DISTINCT user_id) FROM coin_transactions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as weekly_active_users
      `;
      
      const results = await executeQuery(statsQuery);
      return results[0];
    } catch (error) {
      throw new Error(`Error getting gamification statistics: ${error.message}`);
    }
  }

  // Initialize default badges
  static async initializeDefaultBadges() {
    try {
      const defaultBadges = [
        {
          name: 'First Steps',
          description: 'Complete your first test',
          badge_type: 'milestone',
          criteria_type: 'test_score',
          criteria_value: 1,
          coins_reward: 10
        },
        {
          name: 'Math Champ',
          description: 'Score 90% or higher on a test',
          badge_type: 'achievement',
          criteria_type: 'test_score',
          criteria_value: 90,
          coins_reward: 25
        },
        {
          name: 'Perfect Score',
          description: 'Score 100% on a test',
          badge_type: 'achievement',
          criteria_type: 'test_score',
          criteria_value: 100,
          coins_reward: 50
        },
        {
          name: 'Consistent Learner',
          description: 'Attend 10 classes',
          badge_type: 'milestone',
          criteria_type: 'attendance',
          criteria_value: 10,
          coins_reward: 30
        },
        {
          name: 'Video Explorer',
          description: 'Complete 5 video lessons',
          badge_type: 'milestone',
          criteria_type: 'video_completion',
          criteria_value: 5,
          coins_reward: 20
        },
        {
          name: 'Coin Collector',
          description: 'Earn 100 coins',
          badge_type: 'milestone',
          criteria_type: 'total_coins',
          criteria_value: 100,
          coins_reward: 25
        }
      ];
      
      for (const badge of defaultBadges) {
        // Check if badge already exists
        const existingQuery = `SELECT id FROM badges WHERE name = ?`;
        const existing = await executeQuery(existingQuery, [badge.name]);
        
        if (existing.length === 0) {
          await Gamification.createBadge(badge);
        }
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error initializing default badges: ${error.message}`);
    }
  }
}

module.exports = Gamification;


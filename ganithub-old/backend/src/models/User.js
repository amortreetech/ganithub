const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.password_hash = userData.password_hash;
    this.role = userData.role;
    this.first_name = userData.first_name;
    this.last_name = userData.last_name;
    this.phone = userData.phone;
    this.date_of_birth = userData.date_of_birth;
    this.grade_level = userData.grade_level;
    this.profile_picture = userData.profile_picture;
    this.is_active = userData.is_active;
    this.email_verified = userData.email_verified;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  // Create a new user
  static async create(userData) {
    try {
      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(userData.password, saltRounds);

      const query = `
        INSERT INTO users (
          email, password_hash, role, first_name, last_name, 
          phone, date_of_birth, grade_level, profile_picture
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        userData.email,
        password_hash,
        userData.role,
        userData.first_name,
        userData.last_name,
        userData.phone || null,
        userData.date_of_birth || null,
        userData.grade_level || null,
        userData.profile_picture || null
      ];

      const result = await executeQuery(query, values);
      
      // Return the created user (without password)
      return await User.findById(result.insertId);
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const query = `
        SELECT id, email, role, first_name, last_name, phone, 
               date_of_birth, grade_level, profile_picture, 
               is_active, email_verified, created_at, updated_at
        FROM users WHERE id = ? AND is_active = TRUE
      `;
      
      const results = await executeQuery(query, [id]);
      return results.length > 0 ? new User(results[0]) : null;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const query = `
        SELECT * FROM users WHERE email = ? AND is_active = TRUE
      `;
      
      const results = await executeQuery(query, [email]);
      return results.length > 0 ? new User(results[0]) : null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  // Verify password
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      throw new Error(`Error verifying password: ${error.message}`);
    }
  }

  // Update user profile
  async update(updateData) {
    try {
      const allowedFields = [
        'first_name', 'last_name', 'phone', 'date_of_birth', 
        'grade_level', 'profile_picture'
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
        UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await executeQuery(query, values);
      
      // Return updated user
      return await User.findById(this.id);
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);
      
      const query = `
        UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await executeQuery(query, [password_hash, this.id]);
      return true;
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }

  // Get all users (admin only)
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT id, email, role, first_name, last_name, phone, 
               date_of_birth, grade_level, profile_picture, 
               is_active, email_verified, created_at, updated_at
        FROM users WHERE is_active = TRUE
      `;
      
      const values = [];
      
      if (filters.role) {
        query += ' AND role = ?';
        values.push(filters.role);
      }
      
      if (filters.grade_level) {
        query += ' AND grade_level = ?';
        values.push(filters.grade_level);
      }
      
      query += ' ORDER BY created_at DESC';
      
      if (filters.limit) {
        query += ' LIMIT ?';
        values.push(parseInt(filters.limit));
      }
      
      const results = await executeQuery(query, values);
      return results.map(userData => new User(userData));
    } catch (error) {
      throw new Error(`Error finding users: ${error.message}`);
    }
  }

  // Deactivate user (soft delete)
  async deactivate() {
    try {
      const query = `
        UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await executeQuery(query, [this.id]);
      return true;
    } catch (error) {
      throw new Error(`Error deactivating user: ${error.message}`);
    }
  }

  // Get user statistics
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          role,
          COUNT(*) as count,
          COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified_count
        FROM users 
        WHERE is_active = TRUE 
        GROUP BY role
      `;
      
      const results = await executeQuery(query);
      return results;
    } catch (error) {
      throw new Error(`Error getting user statistics: ${error.message}`);
    }
  }

  // Get students by parent
  static async getStudentsByParent(parentId) {
    try {
      const query = `
        SELECT u.id, u.email, u.first_name, u.last_name, u.grade_level,
               u.profile_picture, u.created_at, psr.relationship_type
        FROM users u
        JOIN parent_student_relations psr ON u.id = psr.student_id
        WHERE psr.parent_id = ? AND u.is_active = TRUE
        ORDER BY u.first_name
      `;
      
      const results = await executeQuery(query, [parentId]);
      return results;
    } catch (error) {
      throw new Error(`Error getting students by parent: ${error.message}`);
    }
  }

  // Add parent-student relationship
  static async addParentStudentRelation(parentId, studentId, relationshipType) {
    try {
      const query = `
        INSERT INTO parent_student_relations (parent_id, student_id, relationship_type)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE relationship_type = VALUES(relationship_type)
      `;
      
      await executeQuery(query, [parentId, studentId, relationshipType]);
      return true;
    } catch (error) {
      throw new Error(`Error adding parent-student relation: ${error.message}`);
    }
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    const { password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;


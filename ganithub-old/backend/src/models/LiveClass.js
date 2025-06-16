const { executeQuery } = require('../config/database');

class LiveClass {
  constructor(classData) {
    this.id = classData.id;
    this.title = classData.title;
    this.description = classData.description;
    this.subject_id = classData.subject_id;
    this.topic_id = classData.topic_id;
    this.tutor_id = classData.tutor_id;
    this.class_type = classData.class_type;
    this.max_students = classData.max_students;
    this.scheduled_at = classData.scheduled_at;
    this.duration_minutes = classData.duration_minutes;
    this.jitsi_room_id = classData.jitsi_room_id;
    this.meeting_password = classData.meeting_password;
    this.status = classData.status;
    this.grade_level = classData.grade_level;
    this.created_at = classData.created_at;
    this.updated_at = classData.updated_at;
  }

  // Create a new live class
  static async create(classData) {
    try {
      // Generate unique Jitsi room ID
      const jitsi_room_id = `ganithub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const query = `
        INSERT INTO live_classes (
          title, description, subject_id, topic_id, tutor_id, 
          class_type, max_students, scheduled_at, duration_minutes,
          jitsi_room_id, meeting_password, grade_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        classData.title,
        classData.description || null,
        classData.subject_id,
        classData.topic_id || null,
        classData.tutor_id,
        classData.class_type,
        classData.max_students || 1,
        classData.scheduled_at,
        classData.duration_minutes || 60,
        jitsi_room_id,
        classData.meeting_password || null,
        classData.grade_level
      ];

      const result = await executeQuery(query, values);
      return await LiveClass.findById(result.insertId);
    } catch (error) {
      throw new Error(`Error creating live class: ${error.message}`);
    }
  }

  // Find class by ID
  static async findById(id) {
    try {
      const query = `
        SELECT lc.*, 
               s.name as subject_name,
               t.name as topic_name,
               u.first_name as tutor_first_name,
               u.last_name as tutor_last_name
        FROM live_classes lc
        LEFT JOIN subjects s ON lc.subject_id = s.id
        LEFT JOIN topics t ON lc.topic_id = t.id
        LEFT JOIN users u ON lc.tutor_id = u.id
        WHERE lc.id = ?
      `;
      
      const results = await executeQuery(query, [id]);
      return results.length > 0 ? new LiveClass(results[0]) : null;
    } catch (error) {
      throw new Error(`Error finding class by ID: ${error.message}`);
    }
  }

  // Get all classes with filters
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT lc.*, 
               s.name as subject_name,
               t.name as topic_name,
               u.first_name as tutor_first_name,
               u.last_name as tutor_last_name,
               COUNT(ce.student_id) as enrolled_count
        FROM live_classes lc
        LEFT JOIN subjects s ON lc.subject_id = s.id
        LEFT JOIN topics t ON lc.topic_id = t.id
        LEFT JOIN users u ON lc.tutor_id = u.id
        LEFT JOIN class_enrollments ce ON lc.id = ce.class_id AND ce.status = 'enrolled'
        WHERE 1=1
      `;
      
      const values = [];
      
      if (filters.tutor_id) {
        query += ' AND lc.tutor_id = ?';
        values.push(filters.tutor_id);
      }
      
      if (filters.grade_level) {
        query += ' AND lc.grade_level = ?';
        values.push(filters.grade_level);
      }
      
      if (filters.status) {
        query += ' AND lc.status = ?';
        values.push(filters.status);
      }
      
      if (filters.date_from) {
        query += ' AND lc.scheduled_at >= ?';
        values.push(filters.date_from);
      }
      
      if (filters.date_to) {
        query += ' AND lc.scheduled_at <= ?';
        values.push(filters.date_to);
      }
      
      query += ' GROUP BY lc.id ORDER BY lc.scheduled_at ASC';
      
      if (filters.limit) {
        query += ' LIMIT ?';
        values.push(parseInt(filters.limit));
      }
      
      const results = await executeQuery(query, values);
      return results.map(classData => new LiveClass(classData));
    } catch (error) {
      throw new Error(`Error finding classes: ${error.message}`);
    }
  }

  // Enroll student in class
  static async enrollStudent(classId, studentId) {
    try {
      // Check if class exists and has space
      const classInfo = await LiveClass.findById(classId);
      if (!classInfo) {
        throw new Error('Class not found');
      }
      
      // Check current enrollment count
      const enrollmentQuery = `
        SELECT COUNT(*) as count FROM class_enrollments 
        WHERE class_id = ? AND status = 'enrolled'
      `;
      const enrollmentResult = await executeQuery(enrollmentQuery, [classId]);
      
      if (enrollmentResult[0].count >= classInfo.max_students) {
        throw new Error('Class is full');
      }
      
      // Enroll student
      const query = `
        INSERT INTO class_enrollments (class_id, student_id, status)
        VALUES (?, ?, 'enrolled')
        ON DUPLICATE KEY UPDATE status = 'enrolled', enrolled_at = CURRENT_TIMESTAMP
      `;
      
      await executeQuery(query, [classId, studentId]);
      return true;
    } catch (error) {
      throw new Error(`Error enrolling student: ${error.message}`);
    }
  }

  // Get enrolled students
  async getEnrolledStudents() {
    try {
      const query = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.grade_level,
               ce.enrolled_at, ce.status
        FROM class_enrollments ce
        JOIN users u ON ce.student_id = u.id
        WHERE ce.class_id = ? AND u.is_active = TRUE
        ORDER BY ce.enrolled_at ASC
      `;
      
      const results = await executeQuery(query, [this.id]);
      return results;
    } catch (error) {
      throw new Error(`Error getting enrolled students: ${error.message}`);
    }
  }

  // Update class status
  async updateStatus(status) {
    try {
      const query = `
        UPDATE live_classes 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await executeQuery(query, [status, this.id]);
      this.status = status;
      return true;
    } catch (error) {
      throw new Error(`Error updating class status: ${error.message}`);
    }
  }

  // Mark attendance
  static async markAttendance(classId, studentId, attendanceData) {
    try {
      const query = `
        INSERT INTO attendance (
          class_id, student_id, joined_at, left_at, 
          duration_minutes, attendance_status, marked_by, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          joined_at = VALUES(joined_at),
          left_at = VALUES(left_at),
          duration_minutes = VALUES(duration_minutes),
          attendance_status = VALUES(attendance_status),
          marked_by = VALUES(marked_by),
          notes = VALUES(notes)
      `;
      
      const values = [
        classId,
        studentId,
        attendanceData.joined_at || null,
        attendanceData.left_at || null,
        attendanceData.duration_minutes || 0,
        attendanceData.attendance_status || 'absent',
        attendanceData.marked_by || null,
        attendanceData.notes || null
      ];
      
      await executeQuery(query, values);
      return true;
    } catch (error) {
      throw new Error(`Error marking attendance: ${error.message}`);
    }
  }

  // Get attendance for class
  async getAttendance() {
    try {
      const query = `
        SELECT a.*, u.first_name, u.last_name, u.email
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        WHERE a.class_id = ?
        ORDER BY u.first_name, u.last_name
      `;
      
      const results = await executeQuery(query, [this.id]);
      return results;
    } catch (error) {
      throw new Error(`Error getting attendance: ${error.message}`);
    }
  }

  // Get upcoming classes for student
  static async getUpcomingForStudent(studentId) {
    try {
      const query = `
        SELECT lc.*, s.name as subject_name, t.name as topic_name,
               u.first_name as tutor_first_name, u.last_name as tutor_last_name
        FROM live_classes lc
        JOIN class_enrollments ce ON lc.id = ce.class_id
        LEFT JOIN subjects s ON lc.subject_id = s.id
        LEFT JOIN topics t ON lc.topic_id = t.id
        LEFT JOIN users u ON lc.tutor_id = u.id
        WHERE ce.student_id = ? 
          AND ce.status = 'enrolled'
          AND lc.scheduled_at > NOW()
          AND lc.status = 'scheduled'
        ORDER BY lc.scheduled_at ASC
      `;
      
      const results = await executeQuery(query, [studentId]);
      return results.map(classData => new LiveClass(classData));
    } catch (error) {
      throw new Error(`Error getting upcoming classes: ${error.message}`);
    }
  }

  // Get class statistics
  static async getStatistics(filters = {}) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_classes,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_classes,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_classes,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_classes,
          AVG(duration_minutes) as avg_duration
        FROM live_classes
        WHERE 1=1
      `;
      
      const values = [];
      
      if (filters.tutor_id) {
        query += ' AND tutor_id = ?';
        values.push(filters.tutor_id);
      }
      
      if (filters.date_from) {
        query += ' AND scheduled_at >= ?';
        values.push(filters.date_from);
      }
      
      if (filters.date_to) {
        query += ' AND scheduled_at <= ?';
        values.push(filters.date_to);
      }
      
      const results = await executeQuery(query, values);
      return results[0];
    } catch (error) {
      throw new Error(`Error getting class statistics: ${error.message}`);
    }
  }

  // Update class details
  async update(updateData) {
    try {
      const allowedFields = [
        'title', 'description', 'subject_id', 'topic_id', 
        'scheduled_at', 'duration_minutes', 'max_students'
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
        UPDATE live_classes 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await executeQuery(query, values);
      return await LiveClass.findById(this.id);
    } catch (error) {
      throw new Error(`Error updating class: ${error.message}`);
    }
  }

  // Delete class
  async delete() {
    try {
      // Only allow deletion if class hasn't started
      if (this.status !== 'scheduled') {
        throw new Error('Cannot delete class that has started or completed');
      }
      
      const query = `DELETE FROM live_classes WHERE id = ?`;
      await executeQuery(query, [this.id]);
      return true;
    } catch (error) {
      throw new Error(`Error deleting class: ${error.message}`);
    }
  }
}

module.exports = LiveClass;


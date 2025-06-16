const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { executeQuery, findOne, insert } = require("../config/database");

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post(
  "/register",
  [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["student", "tutor", "parent"])
      .withMessage("Valid role is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, password, role, phone, dateOfBirth } =
        req.body;

      // Check if user already exists
      const existingUser = await findOne("users", { email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const userData = {
        first_name: firstName,
        last_name: lastName,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
      };

      const userId = await insert("users", userData);

      // Generate JWT token
      const token = jwt.sign(
        {
          id: userId,
          email,
          role,
        },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      // Get user data (without password)
      const user = await findOne(
        "users",
        { id: userId },
        "id, first_name, last_name, email, role, phone, date_of_birth, created_at"
      );

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await findOne("users", { email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      // Find user
      const user = await findOne("users", { email });
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({
          success: true,
          message:
            "If an account with that email exists, a password reset link has been sent",
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "1h" }
      );

      // In a real application, you would send an email here
      // For now, we'll just return the token (for testing purposes)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent",
        // Remove this in production
        resetToken: resetToken,
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { token, password } = req.body;

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "fallback_secret"
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      // Find user
      const user = await findOne("users", { id: decoded.id });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update password
      await executeQuery(
        "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
        [hashedPassword, user.id]
      );

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Get user
    const user = await findOne(
      "users",
      { id: decoded.id },
      "id, first_name, last_name, email, role, phone, date_of_birth, created_at, updated_at"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [
    body("firstName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("First name cannot be empty"),
    body("lastName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Last name cannot be empty"),
    body("email").optional().isEmail().withMessage("Valid email is required"),
  ],
  async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      const token = authHeader.substring(7);

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "fallback_secret"
        );
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, phone, dateOfBirth } = req.body;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await findOne("users", { email });
        if (existingUser && existingUser.id !== decoded.id) {
          return res.status(400).json({
            success: false,
            message: "Email is already taken",
          });
        }
      }

      // Prepare update data
      const updateData = {};
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;
      if (email) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone || null;
      if (dateOfBirth !== undefined)
        updateData.date_of_birth = dateOfBirth || null;
      updateData.updated_at = new Date();

      // Update user
      await executeQuery("UPDATE users SET ? WHERE id = ?", [
        updateData,
        decoded.id,
      ]);

      // Get updated user
      const updatedUser = await findOne(
        "users",
        { id: decoded.id },
        "id, first_name, last_name, email, role, phone, date_of_birth, created_at, updated_at"
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

module.exports = router;

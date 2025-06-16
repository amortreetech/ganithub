import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import TutorDashboard from "./components/dashboards/TutorDashboard";
import ParentDashboard from "./components/dashboards/ParentDashboard";
import "./App.css";

// Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GanitHub
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/login"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </a>
              <a
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Learn Math the
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Fun Way
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join thousands of students in our interactive math learning
            platform. Live classes, engaging videos, fun tests, and gamified
            learning experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:shadow-xl transition-all"
            >
              Start Learning Today
            </a>
            <a
              href="/login"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-medium hover:border-blue-600 hover:text-blue-600 transition-all"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Live Classes
            </h3>
            <p className="text-gray-600">
              Interactive live sessions with expert tutors
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎮</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Gamification
            </h3>
            <p className="text-gray-600">
              Earn coins, badges, and level up as you learn
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Progress Tracking
            </h3>
            <p className="text-gray-600">
              Monitor learning progress with detailed analytics
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Achievements
            </h3>
            <p className="text-gray-600">
              Unlock achievements and compete with friends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "student":
      return <StudentDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "tutor":
      return <TutorDashboard />;
    case "parent":
      return <ParentDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            {/* Role-specific routes */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor/*"
              element={
                <ProtectedRoute allowedRoles={["tutor"]}>
                  <TutorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/*"
              element={
                <ProtectedRoute allowedRoles={["parent"]}>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

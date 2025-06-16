import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate passwords
      if (!formData.password || !formData.confirmPassword) {
        throw new Error("Both password fields are required");
      }

      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Simulate API call to backend
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password: formData.password,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Password Reset Successful!
            </h1>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your password has been reset successfully!
              </h2>

              <p className="text-gray-600 mb-6">
                You can now sign in with your new password. You will be
                redirected to the login page in a few seconds.
              </p>

              <Link to="/login">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Continue to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-gray-600 mt-2">Enter your new password below</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Create New Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Choose a strong password to secure your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 pt-0">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Password Requirements:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li
                    className={`flex items-center gap-2 ${
                      formData.password.length >= 8 ? "text-green-600" : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        formData.password.length >= 8
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    At least 8 characters long
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      /(?=.*[a-z])/.test(formData.password)
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        /(?=.*[a-z])/.test(formData.password)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    One lowercase letter
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      /(?=.*[A-Z])/.test(formData.password)
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        /(?=.*[A-Z])/.test(formData.password)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    One uppercase letter
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      /(?=.*\d)/.test(formData.password) ? "text-green-600" : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        /(?=.*\d)/.test(formData.password)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    One number
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Resetting Password...
                  </div>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Video, 
  Plus,
  Calendar,
  BarChart3,
  Clock,
  Star,
  Upload
} from 'lucide-react';

const TutorDashboard = () => {
  const { user } = useAuth();

  // Mock data for demonstration
  const stats = {
    totalStudents: 45,
    activeClasses: 6,
    totalTests: 12,
    totalVideos: 8,
    averageRating: 4.8,
    totalEarnings: 2400
  };

  const upcomingClasses = [
    {
      id: 1,
      title: "Algebra Fundamentals",
      time: "2:00 PM",
      date: "Today",
      students: 15,
      type: "live"
    },
    {
      id: 2,
      title: "Geometry Basics",
      time: "4:00 PM",
      date: "Tomorrow",
      students: 12,
      type: "live"
    }
  ];

  const recentTests = [
    {
      id: 1,
      title: "Linear Equations Quiz",
      attempts: 23,
      averageScore: 87,
      created: "2 days ago"
    },
    {
      id: 2,
      title: "Quadratic Functions Test",
      attempts: 18,
      averageScore: 79,
      created: "1 week ago"
    }
  ];

  const studentProgress = [
    { name: 'Alice Johnson', progress: 92, lastActive: '2 hours ago' },
    { name: 'Bob Smith', progress: 78, lastActive: '1 day ago' },
    { name: 'Carol Davis', progress: 85, lastActive: '3 hours ago' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tutor Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.first_name || 'Tutor'}</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">My Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  <p className="text-xs text-green-600">+3 this week</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeClasses}</p>
                  <p className="text-xs text-blue-600">2 scheduled today</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(stats.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Classes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Classes
              </CardTitle>
              <CardDescription>Your scheduled classes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingClasses.map((class_) => (
                <div key={class_.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{class_.title}</h3>
                      <p className="text-sm text-gray-600">{class_.students} students enrolled</p>
                      <p className="text-sm text-blue-600">{class_.date} at {class_.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Start Class
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Test
              </Button>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Video className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Class
              </Button>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Tests
              </CardTitle>
              <CardDescription>Test performance overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">{test.title}</h3>
                    <p className="text-sm text-gray-600">{test.attempts} attempts</p>
                    <p className="text-sm text-gray-500">Created {test.created}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{test.averageScore}%</div>
                    <p className="text-xs text-gray-500">Avg. Score</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Student Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Progress
              </CardTitle>
              <CardDescription>Top performing students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {studentProgress.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">Last active: {student.lastActive}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{student.progress}%</div>
                    <p className="text-xs text-gray-500">Progress</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Content Management */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold text-gray-900">My Tests</h3>
              <p className="text-sm text-gray-600">{stats.totalTests} tests created</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Video className="h-8 w-8 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold text-gray-900">My Videos</h3>
              <p className="text-sm text-gray-600">{stats.totalVideos} videos uploaded</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">Detailed insights</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;


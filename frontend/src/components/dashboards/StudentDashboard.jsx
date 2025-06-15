import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  Star, 
  Play, 
  Users, 
  Target,
  Coins,
  Award,
  TrendingUp
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();

  // Mock data for demonstration
  const stats = {
    totalCoins: 450,
    level: 5,
    progressToNextLevel: 75,
    testsCompleted: 12,
    averageScore: 85,
    classesAttended: 8,
    videosWatched: 25,
    badges: 6
  };

  const upcomingClasses = [
    {
      id: 1,
      title: "Algebra Basics",
      tutor: "Ms. Sarah",
      time: "2:00 PM",
      date: "Today",
      type: "live"
    },
    {
      id: 2,
      title: "Geometry Fun",
      tutor: "Mr. John",
      time: "4:00 PM",
      date: "Tomorrow",
      type: "live"
    }
  ];

  const recentTests = [
    {
      id: 1,
      title: "Addition & Subtraction",
      score: 95,
      date: "2 days ago",
      difficulty: "Easy"
    },
    {
      id: 2,
      title: "Multiplication Tables",
      score: 78,
      date: "1 week ago",
      difficulty: "Medium"
    }
  ];

  const recommendedVideos = [
    {
      id: 1,
      title: "Fun with Fractions",
      duration: "15 min",
      thumbnail: "🧮",
      difficulty: "Medium"
    },
    {
      id: 2,
      title: "Shape Adventures",
      duration: "12 min",
      thumbnail: "🔺",
      difficulty: "Easy"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome back, {user?.first_name || 'Student'}! 🎉
          </h1>
          <p className="text-lg text-gray-600">Ready to learn some amazing math today?</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Total Coins</p>
                  <p className="text-2xl font-bold">{stats.totalCoins}</p>
                </div>
                <Coins className="h-8 w-8 text-yellow-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Level</p>
                  <p className="text-2xl font-bold">{stats.level}</p>
                  <Progress value={stats.progressToNextLevel} className="mt-2 h-2" />
                </div>
                <Star className="h-8 w-8 text-purple-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-teal-500 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Tests Completed</p>
                  <p className="text-2xl font-bold">{stats.testsCompleted}</p>
                </div>
                <Target className="h-8 w-8 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Average Score</p>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Classes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Upcoming Classes
              </CardTitle>
              <CardDescription>Your scheduled live classes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingClasses.map((class_) => (
                <div key={class_.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{class_.title}</h3>
                      <p className="text-sm text-gray-600">with {class_.tutor}</p>
                      <p className="text-sm text-blue-600">{class_.date} at {class_.time}</p>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    <Play className="h-4 w-4 mr-2" />
                    Join
                  </Button>
                </div>
              ))}
              {upcomingClasses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming classes scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600">
                <Target className="h-4 w-4 mr-2" />
                Take a Test
              </Button>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Play className="h-4 w-4 mr-2" />
                Watch Videos
              </Button>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Award className="h-4 w-4 mr-2" />
                View Badges
              </Button>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Classes
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Recent Test Results
              </CardTitle>
              <CardDescription>Your latest test performances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                  <div>
                    <h3 className="font-semibold text-gray-900">{test.title}</h3>
                    <p className="text-sm text-gray-600">{test.date}</p>
                    <Badge variant={test.difficulty === 'Easy' ? 'secondary' : test.difficulty === 'Medium' ? 'default' : 'destructive'}>
                      {test.difficulty}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${test.score >= 80 ? 'text-green-600' : test.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {test.score}%
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(test.score / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommended Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-purple-500" />
                Recommended Videos
              </CardTitle>
              <CardDescription>Perfect for your learning level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendedVideos.map((video) => (
                <div key={video.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-2xl">
                    {video.thumbnail}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{video.title}</h3>
                    <p className="text-sm text-gray-600">{video.duration}</p>
                    <Badge variant="outline">{video.difficulty}</Badge>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;


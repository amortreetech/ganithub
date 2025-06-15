import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  User, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Star, 
  Award,
  Calendar,
  DollarSign,
  FileText,
  BarChart3
} from 'lucide-react';

const ParentDashboard = () => {
  const { user } = useAuth();

  // Mock data for demonstration
  const children = [
    {
      id: 1,
      name: 'Emma Johnson',
      age: 10,
      grade: '5th Grade',
      totalCoins: 320,
      level: 4,
      progressToNextLevel: 60,
      classesAttended: 12,
      testsCompleted: 8,
      averageScore: 88,
      badges: 5,
      lastActive: '2 hours ago'
    },
    {
      id: 2,
      name: 'Liam Johnson',
      age: 8,
      grade: '3rd Grade',
      totalCoins: 180,
      level: 2,
      progressToNextLevel: 80,
      classesAttended: 8,
      testsCompleted: 5,
      averageScore: 92,
      badges: 3,
      lastActive: '1 day ago'
    }
  ];

  const upcomingClasses = [
    {
      id: 1,
      childName: 'Emma Johnson',
      title: "Algebra Basics",
      tutor: "Ms. Sarah",
      time: "2:00 PM",
      date: "Today"
    },
    {
      id: 2,
      childName: 'Liam Johnson',
      title: "Fun with Numbers",
      tutor: "Mr. John",
      time: "4:00 PM",
      date: "Tomorrow"
    }
  ];

  const recentPayments = [
    {
      id: 1,
      description: 'Monthly Subscription - Premium Plan',
      amount: 49.99,
      date: '2024-06-01',
      status: 'Paid'
    },
    {
      id: 2,
      description: 'Extra Classes Package',
      amount: 25.00,
      date: '2024-05-28',
      status: 'Paid'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
            <p className="text-gray-600">Monitor your children's learning progress</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>

        {/* Children Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {children.map((child) => (
            <Card key={child.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{child.name}</h3>
                    <p className="text-sm text-gray-600">{child.grade} • Age {child.age}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Level and Progress */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold">Level {child.level}</span>
                  </div>
                  <span className="text-sm text-gray-600">{child.progressToNextLevel}% to next level</span>
                </div>
                <Progress value={child.progressToNextLevel} className="h-2" />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{child.totalCoins}</div>
                    <div className="text-xs text-gray-600">Coins Earned</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{child.averageScore}%</div>
                    <div className="text-xs text-gray-600">Avg. Score</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{child.classesAttended}</div>
                    <div className="text-xs text-gray-600">Classes</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{child.badges}</div>
                    <div className="text-xs text-gray-600">Badges</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last active: {child.lastActive}</span>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Classes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Classes
              </CardTitle>
              <CardDescription>Your children's scheduled classes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingClasses.map((class_) => (
                <div key={class_.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{class_.title}</h3>
                      <p className="text-sm text-gray-600">{class_.childName} • with {class_.tutor}</p>
                      <p className="text-sm text-blue-600">{class_.date} at {class_.time}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Scheduled</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Children</span>
                <span className="font-semibold">{children.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Classes</span>
                <span className="font-semibold">{upcomingClasses.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Coins</span>
                <span className="font-semibold">{children.reduce((sum, child) => sum + child.totalCoins, 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Badges</span>
                <span className="font-semibold">{children.reduce((sum, child) => sum + child.badges, 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>Recent payments and invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">{payment.description}</h3>
                    <p className="text-sm text-gray-600">{payment.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">${payment.amount}</div>
                    <Badge variant="secondary" className="text-xs">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Payments
              </Button>
            </CardContent>
          </Card>

          {/* Learning Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Learning Insights
              </CardTitle>
              <CardDescription>Performance trends and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800">Great Progress!</span>
                </div>
                <p className="text-sm text-green-700">
                  Emma's math scores have improved by 15% this month. Keep up the excellent work!
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-800">Recommendation</span>
                </div>
                <p className="text-sm text-blue-700">
                  Consider enrolling Liam in the advanced geometry class to challenge his skills further.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Achievement</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Both children earned new badges this week for consistent attendance!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <User className="h-8 w-8 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Manage Profile</h3>
              <p className="text-sm text-gray-600">Update account settings</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold text-gray-900">Billing</h3>
              <p className="text-sm text-gray-600">Manage subscriptions</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Reports</h3>
              <p className="text-sm text-gray-600">Download progress reports</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-3 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Resources</h3>
              <p className="text-sm text-gray-600">Learning materials</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;


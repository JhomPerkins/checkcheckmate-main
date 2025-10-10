import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Users, FileText, Settings, BarChart3, Calendar, Eye, Clock, Edit, Trash2, CheckCircle, Menu, Megaphone, MessageSquare, Bell, Save, Upload, Download, Shield, Mail, Bell as BellIcon, Palette, Globe, Lock, Key, Trash, AlertTriangle, CheckCircle2, Camera, ChevronLeft, ChevronRight, ChevronDown, X, User, LogOut, Home, GraduationCap, BookOpenCheck, Target, Award, TrendingUp, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ThemeToggle from "@/components/ThemeToggle";
import { useUser } from "@/contexts/UserContext";
import { useQuery } from "@tanstack/react-query";

// Real user data is now fetched from the database via UserContext

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'courses' | 'grades' | 'settings'>('overview');

  // Fetch enrolled courses from database
  const { data: enrolledCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['enrolled-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/students/${user.id}/courses`);
      if (!response.ok) throw new Error('Failed to fetch enrolled courses');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch student grades from database
  const { data: studentGrades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ['student-grades', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/students/${user.id}/grades`);
      if (!response.ok) throw new Error('Failed to fetch student grades');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch assignments due
  const { data: assignmentsDueData = { assignmentsDue: 0 }, isLoading: assignmentsDueLoading } = useQuery({
    queryKey: ['assignments-due', user?.id],
    queryFn: async () => {
      if (!user?.id) return { assignmentsDue: 0 };
      const response = await fetch(`/api/students/${user.id}/assignments-due`);
      if (!response.ok) throw new Error('Failed to fetch assignments due');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch study statistics
  const { data: studyStats = {
    assignmentsCompleted: 0,
    quizzesTaken: 0,
    totalStudyHours: 0,
    currentStreak: 0
  }, isLoading: studyStatsLoading } = useQuery({
    queryKey: ['study-statistics', user?.id],
    queryFn: async () => {
      if (!user?.id) return {
        assignmentsCompleted: 0,
        quizzesTaken: 0,
        totalStudyHours: 0,
        currentStreak: 0
      };
      const response = await fetch(`/api/students/${user.id}/study-statistics`);
      if (!response.ok) throw new Error('Failed to fetch study statistics');
      return response.json();
    },
    enabled: !!user?.id,
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "Dr. Martinez", message: "Welcome to the course chat! Feel free to ask any questions.", timestamp: "2:30 PM", isInstructor: true },
    { id: 2, sender: "System", message: "Assignment 3 has been posted. Due date: November 15th", timestamp: "2:32 PM", isInstructor: false },
    { id: 3, sender: "Alex Johnson", message: "Does anyone know if we can work in groups for the project?", timestamp: "2:35 PM", isInstructor: false },
    { id: 4, sender: "Dr. Martinez", message: "Yes, group work is encouraged for the final project. Max 3 people per group.", timestamp: "2:37 PM", isInstructor: true },
  ]);

  // Mock notifications data with state management
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "info",
      title: "New Assignment Posted",
      message: "Assignment 3: Data Structures is now available",
      timestamp: "2 hours ago",
      isRead: false,
      priority: "medium"
    },
    {
      id: "2",
      type: "warning",
      title: "Assignment Due Soon",
      message: "Assignment 2: Algorithms is due in 2 days",
      timestamp: "1 day ago",
      isRead: false,
      priority: "high"
    },
    {
      id: "3",
      type: "success",
      title: "Grade Posted",
      message: "Your grade for Assignment 1 has been posted",
      timestamp: "3 days ago",
      isRead: true,
      priority: "low"
    },
    {
      id: "4",
      type: "info",
      title: "Course Announcement",
      message: "Midterm exam schedule has been updated",
      timestamp: "4 hours ago",
      isRead: false,
      priority: "medium"
    }
  ]);

  const handleLogout = () => {
    // Use the logout function from context
    logout();
    
    // Navigate back to login page
    setLocation('/login');
  };

  const handleCourseClick = (courseId: string) => {
    setLocation(`/class/${courseId}`);
  };

  // Notification handlers
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // Chat handlers
  const sendMessage = () => {
    if (chatMessage.trim() && user) {
      const newMessage = {
        id: Date.now(),
        sender: user.firstName + " " + user.lastName,
        message: chatMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isInstructor: false
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently enrolled
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments Due</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {assignmentsDueLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{assignmentsDueData.assignmentsDue}</div>
                <p className="text-xs text-muted-foreground">
                  This week
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Learning Progress</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Course Progress</CardTitle>
              <CardDescription>Your progress across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrolledCourses.map((course) => (
                  <div key={course.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{course.code}</span>
                      <span className="text-sm text-muted-foreground">0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `0%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Study Statistics</CardTitle>
              <CardDescription>Your learning patterns and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {studyStatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Loading statistics...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Study Hours</span>
                    <span className="font-medium">{studyStats.totalStudyHours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assignments Completed</span>
                    <span className="font-medium">{studyStats.assignmentsCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quizzes Taken</span>
                    <span className="font-medium">{studyStats.quizzesTaken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Streak</span>
                    <span className="font-medium">{studyStats.currentStreak} days</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <Badge variant="outline">{enrolledCourses.length} courses</Badge>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {enrolledCourses.map((course, index) => (
          <Card 
            key={course.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCourseClick(course.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{course.code}</CardTitle>
                  <CardDescription className="text-sm font-medium">
                    {course.title}
                  </CardDescription>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  index === 0 ? 'bg-blue-600' : 
                  index === 1 ? 'bg-gray-500' : 
                  index === 2 ? 'bg-green-600' : 
                  index === 3 ? 'bg-gray-500' : 
                  'bg-blue-600'
                }`}>
                  {course.code.charAt(0)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {course.instructor?.firstName} {course.instructor?.lastName}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `0%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>Grade: N/A</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Section: {course.section}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>3 credits</span>
                  <span>•</span>
                  <span>Active</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {enrolledCourses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Courses Enrolled</h3>
            <p className="text-muted-foreground text-center">
              You haven't enrolled in any courses yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assignment 3: Data Structures</CardTitle>
                <CardDescription>CS101 - Due in 3 days</CardDescription>
              </div>
              <Badge variant="outline">Not Started</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Implement a binary search tree with insertion, deletion, and search operations.
            </p>
            <div className="flex space-x-2">
              <Button size="sm">
                <FileText className="mr-2 h-4 w-4" />
                View Details
              </Button>
              <Button size="sm" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assignment 2: Algorithms</CardTitle>
                <CardDescription>CS201 - Due in 1 week</CardDescription>
              </div>
              <Badge variant="destructive">Overdue</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze the time complexity of various sorting algorithms.
            </p>
            <div className="flex space-x-2">
              <Button size="sm">
                <FileText className="mr-2 h-4 w-4" />
                View Details
              </Button>
              <Button size="sm" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderGrades = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Grades</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Transcript
        </Button>
      </div>

      {gradesLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading grades...</p>
          </div>
        </div>
      ) : studentGrades.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Grades Available</h3>
              <p className="text-muted-foreground">
                Your grades will appear here once your instructors have graded your assignments.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {studentGrades.map((grade: any, index: number) => {
            const colors = ['text-green-600', 'text-blue-600', 'text-purple-600', 'text-orange-600', 'text-red-600'];
            const colorClass = colors[index % colors.length];
            
            return (
              <Card key={grade.id}>
                <CardHeader>
                  <CardTitle>{grade.course?.code} - {grade.course?.title}</CardTitle>
                  <CardDescription>
                    {grade.course?.instructor?.firstName} {grade.course?.instructor?.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${colorClass}`}>
                      {grade.grade || 'N/A'}%
                    </div>
                    <p className="text-sm text-muted-foreground">Current Grade</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );


  const renderSettings = () => (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your profile and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
              </div>
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {/* Handle photo change */}}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  JPG, PNG, max 5MB
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={user?.firstName || ''}
                  onChange={(e) => {/* Handle change */}}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={user?.lastName || ''}
                  onChange={(e) => {/* Handle change */}}
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  onChange={(e) => {/* Handle change */}}
                />
              </div>
              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={user?.studentId || ''}
                  onChange={(e) => {/* Handle change */}}
                />
              </div>
              <div>
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  value="Computer Science"
                  onChange={(e) => {/* Handle change */}}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                rows={3}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                value="Passionate computer science student with interests in web development and machine learning."
                onChange={(e) => {/* Handle change */}}
                placeholder="Tell us a bit about yourself..."
              />
            </div>

            <Button onClick={() => {/* Handle save profile */}}>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </CardContent>
        </Card>



        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Account Security
            </CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Password</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last changed 2 months ago</p>
              </div>
              <Button variant="outline" onClick={() => {/* Handle change password */}}>
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">CHECKmate</span>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden md:flex bg-background border-r h-[calc(100vh-4rem)] flex-col overflow-hidden transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              {!isSidebarCollapsed && (
                <div className="flex items-center space-x-2">
                  <User className="h-6 w-6 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student'}
                    </span>
                  </div>
                </div>
              )}
              {isSidebarCollapsed && (
                <div className="flex justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="h-8 w-8 p-0"
                data-testid="button-toggle-sidebar"
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <Button
              variant={selectedTab === 'overview' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSelectedTab('overview')}
              data-testid="button-tab-overview"
              title={isSidebarCollapsed ? "Dashboard" : ""}
            >
              <Home className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Dashboard"}
            </Button>
            {/* My Courses Section */}
            <Button
              variant={selectedTab === 'courses' ? "default" : "ghost"}
              onClick={() => {
                setSelectedTab('courses');
                setIsCoursesExpanded(!isCoursesExpanded);
              }}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              title={isSidebarCollapsed ? "My Courses" : ""}
            >
              <BookOpen className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && (
                <>
                  <span className="text-sm font-medium">My Courses</span>
                  {isCoursesExpanded ? (
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </>
              )}
            </Button>
            {!isSidebarCollapsed && isCoursesExpanded && (
              <div className="space-y-1 ml-6">
                {enrolledCourses.map((course, index) => (
                  <Button
                    key={course.id}
                    variant="ghost"
                    onClick={() => handleCourseClick(course.id)}
                    className={`w-full justify-start h-auto p-2 ${
                      course.isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 ${
                      index === 0 ? 'bg-blue-600' : 
                      index === 1 ? 'bg-gray-500' : 
                      index === 2 ? 'bg-green-600' : 
                      index === 3 ? 'bg-gray-500' : 
                      'bg-blue-600'
                    }`}>
                      {course.code.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium truncate">
                        {course.code}
                      </div>
                      {course.title && (
                        <div className="text-xs text-muted-foreground truncate">
                          {course.title}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
            <Button
              variant={selectedTab === 'grades' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSelectedTab('grades')}
              data-testid="button-tab-grades"
              title={isSidebarCollapsed ? "Grades" : ""}
            >
              <BarChart3 className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Grades"}
            </Button>
            <Button
              variant={selectedTab === 'settings' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSelectedTab('settings')}
              data-testid="button-tab-settings"
              title={isSidebarCollapsed ? "Settings" : ""}
            >
              <Settings className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Settings"}
            </Button>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t flex-shrink-0">
            <Button
              variant="ghost"
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={handleLogout}
              data-testid="button-logout"
              title={isSidebarCollapsed ? "Logout" : ""}
            >
              <LogOut className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Logout"}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="p-6">
            {selectedTab === 'overview' && renderOverview()}
            {selectedTab === 'courses' && renderCourses()}
            {selectedTab === 'grades' && renderGrades()}
            {selectedTab === 'settings' && renderSettings()}
          </div>
        </main>
      </div>


    </div>
  );
}

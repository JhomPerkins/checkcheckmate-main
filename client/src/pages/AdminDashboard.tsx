import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Users, BookOpen, FileText, Settings, TrendingUp, Shield, User, Plus, LogOut, ChevronLeft, ChevronRight, Search, Edit, Trash2, Lock, Eye, FileText as FileTextIcon, X, Camera, Save, Mail, MessageSquare, Calendar, Bell, AlertTriangle, CheckCircle, Clock, Archive, Download, Upload, Filter, SortAsc, SortDesc, MoreHorizontal, UserPlus, UserMinus, Copy, RefreshCw, BarChart3, PieChart, Activity, Target, Award, Clock3, TrendingDown, UserCheck, BookOpenCheck, GraduationCap, Brain } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { LLMManager } from "@/components/LLMManager";

// Mock user data - will be replaced with actual authentication
const mockAdmin = {
  id: "1",
  firstName: "Dr. Patricia",
  lastName: "Rodriguez",
  email: "patricia.rodriguez@ollc.edu",
  role: "administrator" as const,
};

// Real user data is now fetched from the database

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'programs' | 'courses' | 'student-approval' | 'reports' | 'settings'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userView, setUserView] = useState<'active' | 'archived' | 'all'>('active');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'permissions' | 'detection' | 'logs'>('users');
  const [isAIAnalyticsOpen, setIsAIAnalyticsOpen] = useState(false);
  
  // Fetch pending students for approval
  const { data: pendingStudents = [], isLoading: pendingStudentsLoading, refetch: refetchPendingStudents } = useQuery({
    queryKey: ['pending-students'],
    queryFn: async () => {
      const response = await fetch('/api/admin/pending-students');
      if (!response.ok) throw new Error('Failed to fetch pending students');
      return response.json();
    },
  });

  
  // User Management states - fetch real users from database
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users', userView],
    queryFn: async () => {
      const url = userView === 'all' ? '/api/users' : `/api/users?status=${userView}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch users');
      const usersData = await response.json();
      
      // Fetch assigned programs for each instructor
      const usersWithPrograms = await Promise.all(
        usersData.map(async (user: any) => {
          if (user.role === 'instructor') {
            try {
              const programsResponse = await fetch(`/api/instructors/${user.id}/programs`);
              if (programsResponse.ok) {
                const programs = await programsResponse.json();
                return { ...user, assignedPrograms: programs.map((p: any) => p.id) };
              }
            } catch (error) {
              console.error('Error fetching instructor programs:', error);
            }
          }
          return { ...user, assignedPrograms: [] };
        })
      );
      
      return usersWithPrograms;
    }
  });

  // Auto-assign instructors to programs for demo
  const assignInstructorsToPrograms = async () => {
    try {
      const instructors = users.filter(user => user.role === 'instructor');
      const computerStudiesProgram = programs.find(p => p.name.includes('Computer Studies'));
      
      if (instructors.length > 0 && computerStudiesProgram) {
        for (const instructor of instructors) {
          // Check if already assigned
          const response = await fetch(`/api/instructors/${instructor.id}/programs`);
          if (response.ok) {
            const existingPrograms = await response.json();
            if (!existingPrograms.some((p: any) => p.id === computerStudiesProgram.id)) {
              // Assign to Computer Studies program
              await fetch(`/api/instructors/${instructor.id}/programs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  programId: computerStudiesProgram.id,
                  assignedBy: user?.id
                }),
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error auto-assigning instructors:', error);
    }
  };

  // Program Management states - fetch real programs from database
  const { data: programs = [], isLoading: programsLoading, refetch: refetchPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await fetch('/api/programs');
      if (!response.ok) throw new Error('Failed to fetch programs');
      return response.json();
    }
  });

  // Ensure admin users are always active on component mount
  useEffect(() => {
    const ensureAdminActive = async () => {
      try {
        await fetch('/api/admin/ensure-active', { method: 'POST' });
        refetchUsers(); // Refresh the user list
        
        // Auto-assign instructors to programs for demo purposes
        await assignInstructorsToPrograms();
      } catch (error) {
        console.error('Error ensuring admin users are active:', error);
      }
    };
    ensureAdminActive();
  }, [refetchUsers, users, programs, user]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);

  // Program Management states
  const [isAddProgramModalOpen, setIsAddProgramModalOpen] = useState(false);
  const [isEditProgramModalOpen, setIsEditProgramModalOpen] = useState(false);
  const [isDeleteProgramDialogOpen, setIsDeleteProgramDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [selectedProgramForCourse, setSelectedProgramForCourse] = useState<string>("");
  const [programInstructors, setProgramInstructors] = useState<User[]>([]);
  const [instructorProgramsCache, setInstructorProgramsCache] = useState<Record<string, string[]>>({});
  const [isLoadingInstructorPrograms, setIsLoadingInstructorPrograms] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: '',
    code: '',
    description: ''
  });

  // Notification states
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    show: boolean;
  }>({
    type: 'info',
    message: '',
    show: false
  });
  
  // Form states
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isActive: true,
    assignedPrograms: [] as string[] // Array of program IDs for instructors
  });

  // Admin Settings state
  const [profileSettings, setProfileSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: "Administration",
    title: "System Administrator",
    bio: "Experienced administrator managing the CHECKmate learning management system.",
    language: "en"
  });

  // Update profile settings when user data is available
  useEffect(() => {
    if (user) {
      setProfileSettings(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      }));
    }
  }, [user]);



  // Course Management state - fetch from API
  const { data: courses = [], isLoading: coursesLoading, refetch: refetchCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds to ensure fresh data
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [courseStatusFilter, setCourseStatusFilter] = useState("All Status");
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch enrolled students for selected course
  const { data: enrolledStudents = [], isLoading: enrolledStudentsLoading } = useQuery({
    queryKey: ['enrolled-students', selectedCourse?.id],
    queryFn: async () => {
      if (!selectedCourse?.id) return [];
      const response = await fetch(`/api/courses/${selectedCourse.id}/enrollments`);
      if (!response.ok) throw new Error('Failed to fetch enrolled students');
      return response.json();
    },
    enabled: !!selectedCourse?.id,
  });

  // Fetch course instructor
  const { data: courseInstructor = null, isLoading: instructorLoading } = useQuery({
    queryKey: ['course-instructor', selectedCourse?.id],
    queryFn: async () => {
      if (!selectedCourse?.id) return null;
      const response = await fetch(`/api/courses/${selectedCourse.id}/instructor`);
      if (!response.ok) throw new Error('Failed to fetch course instructor');
      return response.json();
    },
    enabled: !!selectedCourse?.id,
  });

  // Fetch available students (not enrolled in the selected course)
  const { data: allStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['available-students', selectedCourse?.id],
    queryFn: async () => {
      if (!selectedCourse?.id) return [];
      const response = await fetch(`/api/students/available?courseId=${selectedCourse.id}`);
      if (!response.ok) throw new Error('Failed to fetch available students');
      return response.json();
    },
    enabled: !!selectedCourse?.id && isAddStudentModalOpen,
  });

  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    description: '',
    instructor: '',
    section: 'A',
    programId: '',
    maxStudents: 50,
    startDate: '',
    endDate: '',
    status: 'Draft'
  });

  // Reporting state
  const [selectedReportType, setSelectedReportType] = useState<'overview' | 'course' | 'student' | 'activity'>('overview');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);

  // Mock reporting data - empty until real data is implemented
  const [courseReports] = useState([]);
  const [studentProgress] = useState([]);
  const [activityLogs] = useState([]);

  const [notifications, setNotifications] = useState([
    {
      id: "2",
      type: "warning",
      title: "Instructor Interface Problem",
      message: "Assignment creation form validation failing",
      timestamp: "15 minutes ago",
      isRead: false,
      priority: "medium"
    },
    {
      id: "4",
      type: "error",
      title: "Login Issue",
      message: "Multiple students reporting login failures",
      timestamp: "2 hours ago",
      isRead: false,
      priority: "high"
    },
    {
      id: "5",
      type: "warning",
      title: "Instructor Dashboard",
      message: "Course management interface not loading properly",
      timestamp: "3 hours ago",
      isRead: true,
      priority: "medium"
    }
  ]);

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

  // Sign out handler
  const handleSignOut = () => {
    // Clear any stored authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    
    // Navigate back to login page
    setLocation('/login');
  };

  // User Management handlers
  const handleAddUser = () => {
    setUserForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      isActive: true,
      assignedPrograms: []
    });
    setIsAddUserModalOpen(true);
  };


  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleEditUser = async (user: any) => {
    setSelectedUser(user);
    setIsEditUserModalOpen(true); // Open modal immediately for better UX
    
    // Use cached assigned programs if available, otherwise fetch them
    let assignedPrograms: string[] = [];
    if (user.role === 'instructor') {
      if (instructorProgramsCache[user.id]) {
        assignedPrograms = instructorProgramsCache[user.id];
    setUserForm({
          firstName: user.firstName,
          lastName: user.lastName,
      email: user.email,
          password: '', // Don't pre-fill password for security
          isActive: user.isActive,
          assignedPrograms
        });
      } else {
        setIsLoadingInstructorPrograms(true);
        try {
          const response = await fetch(`/api/instructors/${user.id}/programs`);
          if (response.ok) {
            const programs = await response.json();
            assignedPrograms = programs.map((p: any) => p.id);
            // Cache the result
            setInstructorProgramsCache(prev => ({
              ...prev,
              [user.id]: assignedPrograms
            }));
          }
        } catch (error) {
          console.error('Error fetching instructor programs:', error);
        } finally {
          setIsLoadingInstructorPrograms(false);
        }
        
        setUserForm({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: '', // Don't pre-fill password for security
          isActive: user.isActive,
          assignedPrograms
        });
      }
    } else {
      setUserForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '', // Don't pre-fill password for security
        isActive: user.isActive,
        assignedPrograms
      });
    }
  };

  const handleSaveUser = async () => {
    if (isAddUserModalOpen) {
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: userForm.firstName,
            lastName: userForm.lastName,
            email: userForm.email,
            password: userForm.password,
            role: 'instructor'
          }),
        });
        
        if (response.ok) {
          const newUser = await response.json();
          
          // Assign instructor to selected programs
          if (userForm.assignedPrograms.length > 0) {
            const assignmentPromises = userForm.assignedPrograms.map(programId =>
              fetch(`/api/instructors/${newUser.id}/programs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  programId,
                  assignedBy: user?.id
                }),
              })
            );
            
        await Promise.all(assignmentPromises);
        
        // Update cache
        setInstructorProgramsCache(prev => ({
          ...prev,
          [newUser.id]: userForm.assignedPrograms
        }));
      }
      
      setIsAddUserModalOpen(false);
      showNotification('success', 'Instructor created successfully!');
      // Refresh the users list
      refetchUsers();
        } else {
          showNotification('error', 'Failed to create instructor');
        }
      } catch (error) {
        console.error('Error creating instructor:', error);
      }
    } else if (isEditUserModalOpen && selectedUser) {
      try {
        const updateData: any = {
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          email: userForm.email,
          isActive: userForm.isActive,
        };
        
        // Only include password if it's provided
        if (userForm.password && userForm.password.trim() !== '') {
          updateData.password = userForm.password;
        }
        
        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        if (response.ok) {
          // Update program assignments for instructors
          if (selectedUser.role === 'instructor') {
            try {
              // First, remove all existing assignments
              const currentProgramsResponse = await fetch(`/api/instructors/${selectedUser.id}/programs`);
              if (currentProgramsResponse.ok) {
                const currentPrograms = await currentProgramsResponse.json();
                const removePromises = currentPrograms.map((program: any) =>
                  fetch(`/api/instructors/${selectedUser.id}/programs/${program.id}`, {
                    method: 'DELETE'
                  })
                );
                await Promise.all(removePromises);
              }
              
          // Then, add new assignments
          if (userForm.assignedPrograms.length > 0) {
            const assignmentPromises = userForm.assignedPrograms.map(programId =>
              fetch(`/api/instructors/${selectedUser.id}/programs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  programId,
                  assignedBy: user?.id
                }),
              })
            );
            await Promise.all(assignmentPromises);
            
            // Update cache
            setInstructorProgramsCache(prev => ({
              ...prev,
              [selectedUser.id]: userForm.assignedPrograms
            }));
          }
            } catch (programError) {
              console.error('Error updating program assignments:', programError);
              // Don't fail the entire operation if program assignment fails
            }
          }
          
          // Close modal and show success
          setIsEditUserModalOpen(false);
    setSelectedUser(null);
          showNotification('success', 'User updated successfully!');
          refetchUsers();
        } else {
          showNotification('error', 'Failed to update user');
        }
      } catch (error) {
        console.error('Error updating user:', error);
        showNotification('error', 'Error updating user');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      // First try to delete the user
      const deleteResponse = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      if (deleteResponse.ok) {
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
        const message = selectedUser.isActive 
          ? 'User deactivated successfully! (Cannot delete due to existing data)'
          : 'User deleted successfully!';
        showNotification('success', message);
        // Refresh the users list
        refetchUsers();
      } else {
        // If deletion fails, try soft delete only for active users
        if (selectedUser.isActive) {
          const deactivateResponse = await fetch(`/api/users/${selectedUser.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive: false }),
          });
          
          if (deactivateResponse.ok) {
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
            showNotification('success', 'User deactivated successfully! (Cannot delete due to existing data)');
            // Refresh the users list
          refetchUsers();
          } else {
            const errorData = await deactivateResponse.json();
            showNotification('error', errorData.error || 'Failed to deactivate user');
          }
        } else {
          // For inactive users, deletion should always succeed with force delete
          showNotification('error', 'Failed to delete inactive user');
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('error', 'Error deleting user');
    }
  };

  // Program Management functions
  const handleAddProgram = () => {
    setProgramForm({ name: '', code: '', description: '' });
    setIsAddProgramModalOpen(true);
  };

  const handleEditProgram = (program: any) => {
    setSelectedProgram(program);
    setProgramForm({
      name: program.name,
      code: program.code,
      description: program.description || ''
    });
    setIsEditProgramModalOpen(true);
  };

  const handleDeleteProgram = (program: any) => {
    setSelectedProgram(program);
    setIsDeleteProgramDialogOpen(true);
  };

  const handleSaveProgram = async () => {
    try {
      const url = isEditProgramModalOpen ? `/api/programs/${selectedProgram.id}` : '/api/programs';
      const method = isEditProgramModalOpen ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programForm),
      });
      
      if (response.ok) {
        setIsAddProgramModalOpen(false);
        setIsEditProgramModalOpen(false);
        showNotification('success', 'Program saved successfully!');
        // Refresh the programs list
        refetchPrograms();
      } else {
        showNotification('error', 'Failed to save program');
      }
    } catch (error) {
      console.error('Error saving program:', error);
    }
  };

  const handleConfirmDeleteProgram = async () => {
    try {
      const response = await fetch(`/api/programs/${selectedProgram.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setIsDeleteProgramDialogOpen(false);
        setSelectedProgram(null);
        showNotification('success', 'Program deleted successfully!');
        // Refresh the programs list
        refetchPrograms();
      } else {
        showNotification('error', 'Failed to delete program');
      }
    } catch (error) {
      console.error('Error deleting program:', error);
    }
  };

  const handleSystemSettings = () => {
    setIsSystemSettingsOpen(true);
  };

  // Notification functions
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Bulk operations functions
  const handleBulkArchive = async () => {
    if (selectedUsers.length === 0) {
      showNotification('error', 'Please select users to archive');
      return;
    }

    // Check if any selected users are administrators
    const selectedUserObjects = users.filter(user => selectedUsers.includes(user.id));
    const adminUsers = selectedUserObjects.filter(user => user.role === 'administrator');
    
    if (adminUsers.length > 0) {
      showNotification('info', `Skipping ${adminUsers.length} administrator account(s) - cannot archive admin users`);
    }

    try {
      console.log('Attempting to archive users:', selectedUsers);
      const response = await fetch('/api/users/bulk-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedUsers }),
      });

      console.log('Archive response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Archive result:', result);
        
        let message = result.message || `${result.count || 0} users archived successfully!`;
        if (adminUsers.length > 0) {
          message += ` (${adminUsers.length} admin account(s) skipped)`;
        }
        
        showNotification('success', message);
        setSelectedUsers([]);
        refetchUsers();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.log('Archive error response:', errorData);
        showNotification('error', errorData.error || 'Failed to archive users');
      }
    } catch (error) {
      console.error('Bulk archive error:', error);
      showNotification('error', 'Error archiving users');
    }
  };

  const handleBulkReactivate = async () => {
    if (selectedUsers.length === 0) {
      showNotification('error', 'Please select users to reactivate');
      return;
    }

    try {
      const response = await fetch('/api/users/bulk-reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedUsers }),
      });

      if (response.ok) {
        const result = await response.json();
        showNotification('success', result.message || `${selectedUsers.length} users reactivated successfully!`);
        setSelectedUsers([]);
        refetchUsers();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showNotification('error', errorData.error || 'Failed to reactivate users');
      }
    } catch (error) {
      console.error('Bulk reactivate error:', error);
      showNotification('error', 'Error reactivating users');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      showNotification('error', 'Please select users to delete');
      return;
    }

    // Check if any selected users are administrators
    const selectedUserObjects = users.filter(user => selectedUsers.includes(user.id));
    const adminUsers = selectedUserObjects.filter(user => user.role === 'administrator');
    
    if (adminUsers.length > 0) {
      showNotification('info', `Skipping ${adminUsers.length} administrator account(s) - cannot delete admin users`);
    }

    try {
      const response = await fetch('/api/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedUsers }),
      });

      if (response.ok) {
        const result = await response.json();
        
        let message = result.message || `${result.count || 0} users processed successfully!`;
        if (adminUsers.length > 0) {
          message += ` (${adminUsers.length} admin account(s) skipped)`;
        }
        
        showNotification('success', message);
        setSelectedUsers([]);
        refetchUsers();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showNotification('error', errorData.error || 'Failed to process users');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      showNotification('error', 'Error processing users');
    }
  };

  const handleSelectAllUsers = () => {
    // Filter out admin users from selection
    const selectableUsers = filteredUsers.filter(user => user.role !== 'administrator');
    
    if (selectedUsers.length === selectableUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(selectableUsers.map(user => user.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    // Prevent selecting admin users
    const user = users.find(u => u.id === userId);
    if (user?.role === 'administrator') {
      return; // Don't allow selecting admin users
    }
    
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleProgramToggle = (programId: string) => {
    setUserForm(prev => ({
      ...prev,
      assignedPrograms: prev.assignedPrograms.includes(programId)
        ? prev.assignedPrograms.filter(id => id !== programId)
        : [...prev.assignedPrograms, programId]
    }));
  };

  const resetUserForm = () => {
    setUserForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      isActive: true,
      assignedPrograms: []
    });
    setSelectedUser(null);
  };

  const handleTabChange = (tab: 'users' | 'permissions' | 'detection' | 'logs') => {
    setActiveAdminTab(tab);
  };

  // Course Management handlers
  const handleCreateCourse = () => {
    setCourseForm({
      name: '',
      code: '',
      description: '',
      instructor: '',
      maxStudents: 50,
      startDate: '',
      endDate: '',
      status: 'Draft'
    });
    setIsCreateCourseModalOpen(true);
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setCourseForm({
      name: course.title,
      code: course.code,
      description: course.description,
      instructor: course.instructor,
      maxStudents: course.maxStudents,
      startDate: course.startDate,
      endDate: course.endDate,
      status: course.status
    });
    setIsEditCourseModalOpen(true);
  };

  const handleSaveCourse = async () => {
    try {
    if (isCreateCourseModalOpen) {
        // Create new course via API
        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: courseForm.name,
            code: courseForm.code,
            description: courseForm.description,
            section: courseForm.section,
            instructorId: courseForm.instructor,
            programId: courseForm.programId
          })
        });
        
        if (response.ok) {
          showNotification('success', 'Course created successfully!');
          refetchCourses();
      setIsCreateCourseModalOpen(false);
        } else {
          showNotification('error', 'Failed to create course');
        }
      } else if (isEditCourseModalOpen && selectedCourse) {
        // Update course via API
        const response = await fetch(`/api/courses/${selectedCourse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: courseForm.name,
            code: courseForm.code,
            description: courseForm.description,
            section: courseForm.section,
            instructorId: courseForm.instructor,
            programId: courseForm.programId
          })
        });
        
        if (response.ok) {
          showNotification('success', 'Course updated successfully!');
          refetchCourses();
      setIsEditCourseModalOpen(false);
        } else {
          showNotification('error', 'Failed to update course');
    }
      }
      
      // Reset form
    setCourseForm({
      name: '',
      code: '',
      description: '',
      instructor: '',
        section: 'A',
        programId: '',
      maxStudents: 50,
      startDate: '',
      endDate: '',
      status: 'Draft'
    });
    setSelectedCourse(null);
    } catch (error) {
      console.error('Error saving course:', error);
      showNotification('error', 'Error saving course');
    }
  };

  const handleDeleteCourse = async (course: any) => {
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showNotification('success', 'Course deleted successfully!');
        refetchCourses();
      } else {
        showNotification('error', 'Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      showNotification('error', 'Error deleting course');
    }
  };

  const handleArchiveCourse = async (course: any) => {
    try {
      const response = await fetch(`/api/courses/${course.id}/archive`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        showNotification('success', 'Course archived successfully!');
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      } else {
        showNotification('error', 'Failed to archive course');
      }
    } catch (error) {
      console.error('Error archiving course:', error);
      showNotification('error', 'Error archiving course');
    }
  };

  const handleUnarchiveCourse = async (course: any) => {
    try {
      const response = await fetch(`/api/courses/${course.id}/unarchive`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        showNotification('success', 'Course unarchived successfully!');
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      } else {
        showNotification('error', 'Failed to unarchive course');
      }
    } catch (error) {
      console.error('Error unarchiving course:', error);
      showNotification('error', 'Error unarchiving course');
    }
  };

  const handleToggleCourseStatus = async (course: any) => {
    try {
      const response = await fetch(`/api/courses/${course.id}/toggle-status`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        const newStatus = course.isActive ? 'Inactive' : 'Active';
        showNotification('success', `Course status changed to ${newStatus}!`);
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      } else {
        showNotification('error', 'Failed to update course status');
      }
    } catch (error) {
      console.error('Error toggling course status:', error);
      showNotification('error', 'Error updating course status');
    }
  };

  const handleManageEnrollment = (course: any) => {
    setSelectedCourse(course);
    setIsEnrollmentModalOpen(true);
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refresh the enrolled students list
        queryClient.invalidateQueries({ queryKey: ['enrolled-students', selectedCourse?.id] });
        showNotification('success', 'Student removed from course successfully');
      } else {
        showNotification('error', 'Failed to remove student from course');
      }
    } catch (error) {
      console.error('Error removing enrollment:', error);
      showNotification('error', 'Error removing student from course');
    }
  };

  const handleAddStudentsToCourse = async () => {
    if (selectedStudents.length === 0) {
      showNotification('error', 'Please select at least one student to add');
      return;
    }

    try {
      const promises = selectedStudents.map(studentId =>
        fetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: selectedCourse.id,
            studentId: studentId
          })
        })
      );

      const responses = await Promise.all(promises);
      const failed = responses.filter(response => !response.ok);

      if (failed.length === 0) {
        showNotification('success', `${selectedStudents.length} student(s) added to course successfully`);
        setSelectedStudents([]);
        setIsAddStudentModalOpen(false);
        // Refresh the enrolled students list
        queryClient.invalidateQueries({ queryKey: ['enrolled-students', selectedCourse?.id] });
      } else {
        showNotification('error', `Failed to add ${failed.length} student(s) to the course`);
      }
    } catch (error) {
      console.error('Error adding students to course:', error);
      showNotification('error', 'Error adding students to course');
    }
  };


  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    if (!course) return false;
    
    const courseName = course.title || '';
    const courseCode = course.code || '';
    const instructorName = course.instructor?.firstName && course.instructor?.lastName 
      ? `${course.instructor.firstName} ${course.instructor.lastName}`
      : course.instructor || '';
    
    const matchesSearch = courseName.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                         courseCode.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                         instructorName.toLowerCase().includes(courseSearchQuery.toLowerCase());
    const matchesStatus = courseStatusFilter === "All Status" || 
      (courseStatusFilter === "Active" && course.isActive && !course.isArchived) ||
      (courseStatusFilter === "Inactive" && !course.isActive && !course.isArchived) ||
      (courseStatusFilter === "Archived" && course.isArchived);
    
    return matchesSearch && matchesStatus;
  });

  // Real-time admin statistics from database
  const { data: systemStats = {
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalAdmins: 0,
    totalCourses: 0,
    activeCourses: 0,
    totalAssignments: 0,
    plagiarismReports: 0,
    aiGradingUsage: 0,
  }, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch admin statistics');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time data
  });

  // AI Analytics data
  const { data: aiAnalytics = {
    totalSubmissions: 0,
    aiGradedSubmissions: 0,
    aiUsagePercentage: 0,
    avgConfidence: 0,
    avgProcessingTime: 0,
    plagiarismDetected: 0,
  }, isLoading: aiAnalyticsLoading } = useQuery({
    queryKey: ['/api/admin/ai-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/ai-analytics');
      if (!response.ok) throw new Error('Failed to fetch AI analytics');
      return response.json();
    },
    enabled: isAIAnalyticsOpen, // Only fetch when modal is open
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['/api/admin/activity'],
    enabled: false, // Disabled until backend is ready
    initialData: [
      {
        id: "1",
        type: "user_registration",
        description: "New student registered: Sarah Johnson",
        timestamp: "2024-09-18 14:30",
        status: "completed",
      },
      {
        id: "2",
        type: "course_creation",
        description: "Course created: Advanced Physics by Dr. Chen",
        timestamp: "2024-09-18 13:15",
        status: "completed",
      },
      {
        id: "3",
        type: "ai_grading",
        description: "AI graded 25 assignments in CS101",
        timestamp: "2024-09-18 12:45",
        status: "completed",
      },
    ],
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`;
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All Roles" || user.role === roleFilter;
    const matchesStatus = statusFilter === "All Status" || (user.isActive ? "Active" : "Inactive") === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const renderUserManagement = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Administration</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-system-settings" onClick={handleSystemSettings}>
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
          <Button data-testid="button-add-user" onClick={handleAddUser}>
            <User className="mr-2 h-4 w-4" />
            Add New Instructor
          </Button>
        </div>
      </div>

      {/* User View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label>View:</Label>
            <Select value={userView} onValueChange={(value: 'active' | 'archived' | 'all') => setUserView(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredUsers.length} users
          </span>
        </div>

        {/* Bulk Operations */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedUsers.length} selected
            </span>
            {userView === 'active' && (
              <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            )}
            {userView === 'archived' && (
              <>
                <Button variant="outline" size="sm" onClick={handleBulkReactivate}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Reactivate
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
            {userView === 'all' && (
              <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive Selected
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={selectedTab === 'users' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => setSelectedTab('users')}
        >
          <Users className="mr-2 h-4 w-4" />
          User Management
        </Button>
        <Button
          variant="ghost"
          className="rounded-none border-b-2 border-transparent"
          onClick={() => handleTabChange('permissions')}
        >
          <Lock className="mr-2 h-4 w-4" />
          Permissions & Access
        </Button>
        <Button
          variant="ghost"
          className="rounded-none border-b-2 border-transparent"
          onClick={() => handleTabChange('detection')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Detection Settings
        </Button>
        <Button
          variant="ghost"
          className="rounded-none border-b-2 border-transparent"
          onClick={() => handleTabChange('logs')}
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          System Logs
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Roles">All Roles</SelectItem>
            <SelectItem value="Student">Student</SelectItem>
            <SelectItem value="Professor">Professor</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Status">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAllUsers}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Programs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plagiarism Flags</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
            <TableCell>
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={() => handleSelectUser(user.id)}
                disabled={user.role === 'administrator'}
                className={`rounded ${user.role === 'administrator' ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={user.role === 'administrator' ? 'Cannot select administrator accounts' : ''}
              />
            </TableCell>
                  <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.role === 'instructor' ? (
                      <div className="text-xs text-gray-600">
                        Programs assigned
                      </div>
                    ) : user.role === 'student' ? (
                      <div className="text-xs text-gray-600">
                        {user.programId ? 'Enrolled' : 'No program'}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                    <Badge 
                        variant={user.isActive ? "default" : "destructive"}
                        className={user.isActive ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                        {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                      {user.isArchived && (
                        <Badge variant="secondary" className="text-xs">
                          Archived
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="default"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      None
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        data-testid={`button-edit-user-${user.id}`}
                        onClick={() => handleEditUser(user)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!user.isArchived ? (
                        <>
                          {/* Hide archive button for admin users */}
                          {user.role !== 'administrator' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/users/${user.id}/archive`, {
                                    method: 'PUT',
                                  });
                                  if (response.ok) {
                                    showNotification('success', 'User archived successfully!');
                                    refetchUsers();
                                  } else {
                                    const errorData = await response.json().catch(() => ({ error: 'Failed to archive user' }));
                                    showNotification('error', errorData.error || 'Failed to archive user');
                                  }
                                } catch (error) {
                                  showNotification('error', 'Error archiving user');
                                }
                              }}
                              title="Archive User"
                              className="h-8 w-8 p-0"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Hide delete button for admin users */}
                          {user.role !== 'administrator' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        data-testid={`button-delete-user-${user.id}`}
                        onClick={() => handleDeleteUser(user)}
                              className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/users/${user.id}/reactivate`, {
                                  method: 'PUT',
                                });
                                if (response.ok) {
                                  showNotification('success', 'User reactivated successfully!');
                                  refetchUsers();
                                } else {
                                  showNotification('error', 'Failed to reactivate user');
                                }
                              } catch (error) {
                                showNotification('error', 'Error reactivating user');
                              }
                            }}
                            title="Reactivate User"
                            className="h-8 w-8 p-0"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            data-testid={`button-delete-user-${user.id}`}
                            onClick={() => handleDeleteUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1 to {filteredUsers.length} of {filteredUsers.length} users.
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPermissionsAccess = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Permissions & Access</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-system-settings" onClick={handleSystemSettings}>
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
          <Button data-testid="button-add-role">
            <Plus className="mr-2 h-4 w-4" />
            Add New Role
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={activeAdminTab === 'users' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('users')}
        >
          <Users className="mr-2 h-4 w-4" />
          User Management
        </Button>
        <Button
          variant={activeAdminTab === 'permissions' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('permissions')}
        >
          <Lock className="mr-2 h-4 w-4" />
          Permissions & Access
        </Button>
        <Button
          variant={activeAdminTab === 'detection' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('detection')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Detection Settings
        </Button>
        <Button
          variant={activeAdminTab === 'logs' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('logs')}
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          System Logs
        </Button>
      </div>

      {/* Permissions Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>Manage permissions for different user roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Student</span>
                <Badge variant="outline">Limited Access</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• View assigned courses</p>
                <p>• Submit assignments</p>
                <p>• View grades</p>
                <p>• Access course materials</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Professor</span>
                <Badge variant="outline">Full Access</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Create and manage courses</p>
                <p>• Grade assignments</p>
                <p>• Access AI grading tools</p>
                <p>• View student analytics</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Administrator</span>
                <Badge variant="outline">System Access</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Manage all users</p>
                <p>• System configuration</p>
                <p>• Access all data</p>
                <p>• Security controls</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );

  // Fetch AI configuration
  const { data: aiConfig = {}, isLoading: configLoading } = useQuery({
    queryKey: ['/api/admin/ai-config'],
    queryFn: async () => {
      const response = await fetch('/api/admin/ai-config');
      if (!response.ok) throw new Error('Failed to fetch AI config');
      return response.json();
    },
    enabled: activeAdminTab === 'detection', // Only fetch when detection tab is active
  });

  // Fetch real AI statistics for detection settings
  const { data: detectionAiStats = {
    totalSubmissions: 0,
    aiGradedSubmissions: 0,
    aiUsagePercentage: 0,
    avgConfidence: 0,
    avgProcessingTime: 0,
    plagiarismDetected: 0,
  }, isLoading: detectionStatsLoading } = useQuery({
    queryKey: ['/api/admin/ai-analytics-detection'],
    queryFn: async () => {
      const response = await fetch('/api/admin/ai-analytics');
      if (!response.ok) throw new Error('Failed to fetch AI analytics');
      return response.json();
    },
    enabled: activeAdminTab === 'detection', // Only fetch when detection tab is active
  });

  const renderDetectionSettings = () => {

    const updateConfig = async (key: string, value: string) => {
      try {
        const response = await fetch(`/api/admin/ai-config/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });
        
        if (!response.ok) throw new Error('Failed to update config');
        
        // Refetch config
        queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-config'] });
        
        toast({
          title: "Configuration Updated",
          description: "AI settings have been updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Update Failed",
          description: "Failed to update AI configuration. Please try again.",
          variant: "destructive",
        });
      }
    };

    const resetToDefaults = async () => {
      try {
        const response = await fetch('/api/admin/ai-config/reset', {
          method: 'POST',
        });
        
        if (!response.ok) throw new Error('Failed to reset config');
        
        // Refetch config
        queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-config'] });
        
        toast({
          title: "Configuration Reset",
          description: "AI settings have been reset to defaults.",
        });
      } catch (error) {
        toast({
          title: "Reset Failed",
          description: "Failed to reset AI configuration. Please try again.",
          variant: "destructive",
        });
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Configuration</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button variant="outline" data-testid="button-system-settings" onClick={handleSystemSettings}>
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-b">
          <Button
            variant={activeAdminTab === 'users' ? "default" : "ghost"}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            onClick={() => handleTabChange('users')}
          >
            <Users className="mr-2 h-4 w-4" />
            User Management
          </Button>
          <Button
            variant={activeAdminTab === 'permissions' ? "default" : "ghost"}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            onClick={() => handleTabChange('permissions')}
          >
            <Lock className="mr-2 h-4 w-4" />
            Permissions & Access
          </Button>
          <Button
            variant={activeAdminTab === 'detection' ? "default" : "ghost"}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            onClick={() => handleTabChange('detection')}
          >
            <Eye className="mr-2 h-4 w-4" />
            AI Configuration
          </Button>
          <Button
            variant={activeAdminTab === 'logs' ? "default" : "ghost"}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            onClick={() => handleTabChange('logs')}
          >
            <FileTextIcon className="mr-2 h-4 w-4" />
            System Logs
          </Button>
        </div>

        {configLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading AI configuration...</span>
          </div>
        ) : (
          <>
            {/* AI Configuration Content */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Plagiarism Detection</CardTitle>
                  <CardDescription>Configure plagiarism detection algorithms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Detection Sensitivity</span>
                      <Select 
                        value={aiConfig.plagiarism_sensitivity || 'medium'} 
                        onValueChange={(value) => updateConfig('plagiarism_sensitivity', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (60%)</SelectItem>
                          <SelectItem value="medium">Medium (80%)</SelectItem>
                          <SelectItem value="high">High (95%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Auto-flag Threshold</span>
                      <Input 
                        type="number" 
                        value={aiConfig.plagiarism_threshold || 85} 
                        className="w-20"
                        onChange={(e) => updateConfig('plagiarism_threshold', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Check External Sources</span>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="external-check" 
                          checked={aiConfig.check_external_sources || false}
                          onChange={(e) => updateConfig('check_external_sources', e.target.checked.toString())}
                        />
                        <Label htmlFor="external-check">Enabled</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Grading Settings</CardTitle>
                  <CardDescription>Configure AI-powered grading features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Auto-grading</span>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="auto-grade" 
                          checked={aiConfig.auto_grading_enabled || false}
                          onChange={(e) => updateConfig('auto_grading_enabled', e.target.checked.toString())}
                        />
                        <Label htmlFor="auto-grade">Enabled</Label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence Threshold</span>
                      <Input 
                        type="number" 
                        value={aiConfig.confidence_threshold || 75} 
                        className="w-20"
                        onChange={(e) => updateConfig('confidence_threshold', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Human Review Required</span>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="human-review" 
                          checked={aiConfig.human_review_required || false}
                          onChange={(e) => updateConfig('human_review_required', e.target.checked.toString())}
                        />
                        <Label htmlFor="human-review">Enabled</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real AI Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>AI Performance Statistics</CardTitle>
                <CardDescription>Real-time AI system performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {detectionStatsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading statistics...</span>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{Math.round(detectionAiStats.avgConfidence)}%</div>
                      <p className="text-sm text-muted-foreground">Avg Confidence</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{detectionAiStats.totalSubmissions}</div>
                      <p className="text-sm text-muted-foreground">Total Submissions</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{detectionAiStats.plagiarismDetected}</div>
                      <p className="text-sm text-muted-foreground">Plagiarism Detected</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{detectionAiStats.avgProcessingTime}ms</div>
                      <p className="text-sm text-muted-foreground">Avg Processing Time</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  };

  const renderSystemLogs = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Logs</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-system-settings" onClick={handleSystemSettings}>
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
          <Button data-testid="button-export-logs">
            <FileTextIcon className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={activeAdminTab === 'users' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('users')}
        >
          <Users className="mr-2 h-4 w-4" />
          User Management
        </Button>
        <Button
          variant={activeAdminTab === 'permissions' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('permissions')}
        >
          <Lock className="mr-2 h-4 w-4" />
          Permissions & Access
        </Button>
        <Button
          variant={activeAdminTab === 'detection' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('detection')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Detection Settings
        </Button>
        <Button
          variant={activeAdminTab === 'logs' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('logs')}
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          System Logs
        </Button>
      </div>

      {/* Logs Content */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Logs</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="today">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-muted-foreground">2024-01-18 14:30:25</TableCell>
                  <TableCell><Badge variant="default" className="bg-green-500">INFO</Badge></TableCell>
                  <TableCell>User Management</TableCell>
                  <TableCell>User Jovilyn Saging logged in successfully</TableCell>
                  <TableCell>j.saging@example.edu</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">2024-01-18 14:28:12</TableCell>
                  <TableCell><Badge variant="destructive">ERROR</Badge></TableCell>
                  <TableCell>Plagiarism Detection</TableCell>
                  <TableCell>Failed to process document: timeout</TableCell>
                  <TableCell>System</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">2024-01-18 14:25:45</TableCell>
                  <TableCell><Badge variant="outline" className="border-yellow-500 text-yellow-500">WARNING</Badge></TableCell>
                  <TableCell>AI Grading</TableCell>
                  <TableCell>Low confidence score for assignment CS101-001</TableCell>
                  <TableCell>m.sagun@example.edu</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">2024-01-18 14:20:33</TableCell>
                  <TableCell><Badge variant="default" className="bg-green-500">INFO</Badge></TableCell>
                  <TableCell>System</TableCell>
                  <TableCell>Database backup completed successfully</TableCell>
                  <TableCell>System</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">2024-01-18 14:15:18</TableCell>
                  <TableCell><Badge variant="destructive">ERROR</Badge></TableCell>
                  <TableCell>Authentication</TableCell>
                  <TableCell>Failed login attempt for unknown user</TableCell>
                  <TableCell>Unknown</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing 1 to 5 of 247 log entries.
          </p>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgramManagement = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Program Management</h1>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddProgram} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add New Program
          </Button>
        </div>
      </div>

      {/* Programs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-medium">{program.name}</TableCell>
                <TableCell>{program.code}</TableCell>
                <TableCell>{program.description || 'No description'}</TableCell>
                <TableCell>
                  <Badge variant={program.isActive ? "default" : "destructive"}>
                    {program.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(program.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditProgram(program)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteProgram(program)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderCourseManagement = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Course Management</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['courses'] })}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => {/* Handle bulk actions */}}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => {/* Handle import */}}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Dialog open={isCreateCourseModalOpen} onOpenChange={setIsCreateCourseModalOpen}>
            <DialogTrigger asChild>
          <Button onClick={handleCreateCourse}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Set up a new course with all the necessary details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Program</Label>
                  <Select onValueChange={async (value) => {
                    setCourseForm({...courseForm, programId: value, instructor: ""});
                    setSelectedProgramForCourse(value);
                    
                    // Fetch instructors assigned to this program
                    try {
                      const response = await fetch(`/api/instructors?programId=${value}`);
                      if (response.ok) {
                        const instructors = await response.json();
                        setProgramInstructors(instructors);
                      } else {
                        setProgramInstructors([]);
                      }
                    } catch (error) {
                      console.error('Error fetching program instructors:', error);
                      setProgramInstructors([]);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
        </div>
                <div>
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input
                    id="courseName"
                    value={courseForm.name || ''}
                    onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                    placeholder="Enter course name"
                  />
                </div>
                <div>
                  <Label htmlFor="courseCode">Course Code</Label>
                  <Input
                    id="courseCode"
                    value={courseForm.code || ''}
                    onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                    placeholder="e.g., CS101"
                  />
                </div>
                <div>
                  <Label htmlFor="instructor">Instructor</Label>
                  <Select onValueChange={(value) => setCourseForm({...courseForm, instructor: value})} disabled={!selectedProgramForCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedProgramForCourse ? "Select an instructor" : "Select a program first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProgramForCourse ? (
                        (() => {
                          // Get all instructors and filter by program assignment
                          const allInstructors = users.filter(user => user.role === 'instructor');
                          const assignedInstructors = allInstructors.filter(instructor => {
                            // Check if instructor has assignedPrograms property and includes the selected program
                            return instructor.assignedPrograms && instructor.assignedPrograms.includes(selectedProgramForCourse);
                          });
                          
                          return assignedInstructors.length > 0 ? (
                            assignedInstructors.map((instructor) => (
                              <SelectItem key={instructor.id} value={instructor.id}>
                                {instructor.firstName} {instructor.lastName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-instructors" disabled>
                              No instructors assigned to this program
                            </SelectItem>
                          );
                        })()
                      ) : (
                        <SelectItem value="select-program-first" disabled>
                          Please select a program first
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={courseForm.section || 'A'}
                    onChange={(e) => setCourseForm({...courseForm, section: e.target.value})}
                    placeholder="A"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={courseForm.description || ''}
                    onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                    placeholder="Enter course description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateCourseModalOpen(false);
                  setSelectedProgramForCourse("");
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveCourse}>
                  Create Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={courseSearchQuery}
            onChange={(e) => setCourseSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={courseStatusFilter} onValueChange={setCourseStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Status">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Course Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{courses.filter(c => c.isActive && !c.isArchived).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Archived</p>
                <p className="text-2xl font-bold">{courses.filter(c => c.isArchived).length}</p>
              </div>
              <Archive className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{course.title}</div>
                      <div className="text-sm text-muted-foreground">{course.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{course.code}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        course.isArchived ? 'destructive' :
                        course.isActive ? 'default' : 'secondary'
                      }
                      className={
                        course.isArchived ? 'bg-red-500 hover:bg-red-600' :
                        course.isActive ? 'bg-green-500 hover:bg-green-600' :
                        'bg-yellow-500 hover:bg-yellow-600'
                      }
                    >
                      {course.isArchived ? 'Archived' : course.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{course.instructor}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{course.enrolledStudents} / {course.maxStudents}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(course.enrolledStudents / course.maxStudents) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{course.createdDate}</TableCell>
                  <TableCell className="text-muted-foreground">{course.lastModified}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditCourse(course)}
                        title="Edit Course"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!course.isArchived && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleCourseStatus(course)}
                          title={`Change Status to ${course.isActive ? 'Inactive' : 'Active'}`}
                          className={course.isActive ? 'text-green-600 hover:text-green-700' : 'text-yellow-600 hover:text-yellow-700'}
                        >
                          {course.isActive ? (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-xs">Inactive</span>
                            </div>
                          )}
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleManageEnrollment(course)}
                        title="Manage Enrollment"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      {!course.isArchived ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleArchiveCourse(course)}
                          title="Archive Course"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUnarchiveCourse(course)}
                          title="Unarchive Course"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteCourse(course)}
                        title="Delete Course"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1 to {filteredCourses.length} of {filteredCourses.length} courses.
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reporting and Analytics</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {/* Handle export all reports */}}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button variant="outline" onClick={() => {/* Handle schedule reports */}}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Report
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={selectedReportType === 'overview' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => setSelectedReportType('overview')}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Overview
        </Button>
        <Button
          variant={selectedReportType === 'course' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => setSelectedReportType('course')}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Course Reports
        </Button>
        <Button
          variant={selectedReportType === 'student' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => setSelectedReportType('student')}
        >
          <GraduationCap className="mr-2 h-4 w-4" />
          Student Transcripts
        </Button>
        <Button
          variant={selectedReportType === 'activity' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => setSelectedReportType('activity')}
        >
          <Activity className="mr-2 h-4 w-4" />
          Activity Logs
        </Button>
      </div>

      {/* Overview Reports */}
      {selectedReportType === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                    <p className="text-2xl font-bold">{courses.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Course Performance Overview</CardTitle>
              <CardDescription>Enrollment and completion rates by course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseReports.map((course) => (
                  <div key={course.courseId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{course.courseName} ({course.courseCode})</span>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Enrollment: {course.enrollmentRate}%</span>
                        <span>Completion: {course.completionRate}%</span>
                        <span>Avg Grade: {course.averageGrade}%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Enrollment Rate</span>
                        <span>{course.enrollmentRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${course.enrollmentRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Completion Rate</span>
                        <span>{course.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${course.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course-Level Reports */}
      {selectedReportType === 'course' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Select value={selectedCourse?.courseId || ""} onValueChange={(value) => setSelectedCourse(courseReports.find(c => c.courseId === value))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a course to view detailed reports" />
              </SelectTrigger>
              <SelectContent>
                {courseReports.map((course) => (
                  <SelectItem key={course.courseId} value={course.courseId}>
                    {course.courseName} ({course.courseCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {/* Handle export course report */}}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          {selectedCourse && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Enrollment and Completion */}
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment & Completion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Students</span>
                    <span className="font-bold">{selectedCourse.totalStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completed Students</span>
                    <span className="font-bold">{selectedCourse.completedStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Enrollment Rate</span>
                    <span className="font-bold text-blue-600">{selectedCourse.enrollmentRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completion Rate</span>
                    <span className="font-bold text-green-600">{selectedCourse.completionRate}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Average Grade</span>
                    <span className="font-bold">{selectedCourse.averageGrade}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quiz Average</span>
                    <span className="font-bold">{selectedCourse.quizAverage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Assignment Average</span>
                    <span className="font-bold">{selectedCourse.assignmentAverage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Engagement Score</span>
                    <span className="font-bold">{selectedCourse.engagementScore}/10</span>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Average Time Spent</span>
                    <span className="font-bold">{selectedCourse.averageTimeSpent} hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discussion Posts</span>
                    <span className="font-bold">{selectedCourse.discussionPosts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Activity</span>
                    <span className="font-bold">{selectedCourse.lastActivity}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Student Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Progress Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentProgress.filter(s => s.courseId === selectedCourse.courseId).map((student) => (
                      <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{student.studentName}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.modulesCompleted}/{student.totalModules} modules completed
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{student.progressPercentage}%</div>
                          <div className="text-sm text-muted-foreground">Grade: {student.currentGrade}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Student Transcripts */}
      {selectedReportType === 'student' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Select value={selectedStudent?.studentId || ""} onValueChange={(value) => setSelectedStudent(studentProgress.find(s => s.studentId === value))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a student to view transcript" />
              </SelectTrigger>
              <SelectContent>
                {studentProgress.map((student) => (
                  <SelectItem key={student.studentId} value={student.studentId}>
                    {student.studentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setIsTranscriptModalOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Download Transcript
            </Button>
          </div>

          {selectedStudent && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Student Name</span>
                    <span className="font-bold">{selectedStudent.studentName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Course</span>
                    <span className="font-bold">{selectedStudent.courseName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Current Grade</span>
                    <span className="font-bold text-green-600">{selectedStudent.currentGrade}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Progress</span>
                    <span className="font-bold">{selectedStudent.progressPercentage}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Time Spent</span>
                    <span className="font-bold">{selectedStudent.timeSpent} hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Assignments Submitted</span>
                    <span className="font-bold">{selectedStudent.assignmentsSubmitted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quizzes Completed</span>
                    <span className="font-bold">{selectedStudent.quizzesCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discussion Posts</span>
                    <span className="font-bold">{selectedStudent.discussionPosts}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Module Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Modules Completed</span>
                      <span className="font-bold">{selectedStudent.modulesCompleted}/{selectedStudent.totalModules}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full" 
                        style={{ width: `${selectedStudent.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Activity Logs */}
      {selectedReportType === 'activity' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activity logs..."
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="enrollment">Enrollments</SelectItem>
                <SelectItem value="submission">Submissions</SelectItem>
                <SelectItem value="quiz">Quizzes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {/* Handle export logs */}}>
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{log.course}</TableCell>
                      <TableCell className="text-muted-foreground">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing 1 to {activityLogs.length} of {activityLogs.length} activity logs.
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Student Approval handlers
  const handleApproveStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/admin/students/${studentId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvedBy: user?.id }),
      });

      if (response.ok) {
        refetchPendingStudents();
        refetchUsers(); // Refresh user list
      } else {
        const error = await response.json();
        console.error('Failed to approve student:', error);
      }
    } catch (error) {
      console.error('Error approving student:', error);
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/admin/students/${studentId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvedBy: user?.id }),
      });

      if (response.ok) {
        refetchPendingStudents();
        refetchUsers(); // Refresh user list
      } else {
        const error = await response.json();
        console.error('Failed to reject student:', error);
      }
    } catch (error) {
      console.error('Error rejecting student:', error);
    }
  };

  const renderStudentApproval = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Approval</h1>
          <p className="text-muted-foreground">
            Review and approve student registrations
          </p>
        </div>
      </div>

      {pendingStudentsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pending students...</p>
          </div>
        </div>
      ) : pendingStudents.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
              <p className="text-muted-foreground">
                All student registrations have been reviewed.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingStudents.map((student: any) => (
            <Card key={student.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {student.email}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="secondary">
                          Student ID: {student.studentId}
                        </Badge>
                        <Badge variant="outline">
                          Year {student.yearLevel}
                        </Badge>
                        {student.program && (
                          <Badge variant="outline">
                            {student.program.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Registered: {new Date(student.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectStudent(student.id)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveStudent(student.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="p-4 max-w-4xl mx-auto h-full overflow-hidden">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Manage your admin profile and preferences</p>
      </div>

      <div className="h-full overflow-y-auto">
        {/* Profile Information */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <User className="h-4 w-4 mr-2" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-sm">
              Update your personal information and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Picture */}
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {profileSettings.firstName[0]}{profileSettings.lastName[0]}
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-sm">First Name</Label>
                <Input
                  id="firstName"
                  value={profileSettings.firstName}
                  onChange={(e) => setProfileSettings({...profileSettings, firstName: e.target.value})}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileSettings.lastName}
                  onChange={(e) => setProfileSettings({...profileSettings, lastName: e.target.value})}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileSettings.email}
                  onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="department" className="text-sm">Department</Label>
                <Input
                  id="department"
                  value={profileSettings.department}
                  onChange={(e) => setProfileSettings({...profileSettings, department: e.target.value})}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="title" className="text-sm">Title/Position</Label>
                <Input
                  id="title"
                  value={profileSettings.title}
                  onChange={(e) => setProfileSettings({...profileSettings, title: e.target.value})}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio" className="text-sm">Bio</Label>
              <Textarea
                id="bio"
                rows={2}
                className="w-full mt-1 text-sm resize-none"
                value={profileSettings.bio}
                onChange={(e) => setProfileSettings({...profileSettings, bio: e.target.value})}
                placeholder="Tell us a bit about yourself..."
              />
            </div>

            <Button onClick={() => {/* Handle save profile */}} className="h-8 text-sm">
              <Save className="h-3 w-3 mr-1" />
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">{systemStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +12 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-courses">{systemStats.activeCourses}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.totalCourses} total courses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plagiarism</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-plagiarism-detected">12</div>
            <p className="text-xs text-muted-foreground">
              Cases detected this week
            </p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsAIAnalyticsOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ai-usage">{systemStats.aiGradingUsage}%</div>
            <p className="text-xs text-muted-foreground">
              Grading efficiency
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Click for detailed analytics
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown of user roles in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Students</span>
                <Badge variant="secondary" data-testid="text-student-count">{systemStats.totalStudents}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Instructors</span>
                <Badge variant="secondary" data-testid="text-instructor-count">{systemStats.totalInstructors}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Administrators</span>
                <Badge variant="secondary" data-testid="text-admin-count">{systemStats.totalAdmins}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 4).map((activity) => (
                <div key={activity.id} className="border-b pb-2 last:border-0">
                  <p className="text-sm font-medium" data-testid={`text-activity-${activity.id}`}>
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline" data-testid="button-create-user">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
              <Button className="w-full justify-start" variant="outline" data-testid="button-system-settings">
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Button>
              <Button className="w-full justify-start" variant="outline" data-testid="button-view-reports">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Reports
              </Button>
              <Button className="w-full justify-start" variant="outline" data-testid="button-backup-system">
                <Shield className="mr-2 h-4 w-4" />
                Backup System
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
                <Shield className="h-6 w-6 text-primary" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                  </span>
                  <span className="text-xs text-muted-foreground">Administrator</span>
                </div>
              </div>
              )}
              {isSidebarCollapsed && (
                <div className="flex justify-center">
                  <Shield className="h-6 w-6 text-primary" />
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
              <TrendingUp className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Dashboard"}
            </Button>
            <Button
              variant={selectedTab === 'users' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                        onClick={() => setSelectedTab('users')}
                        data-testid="button-tab-users"
              title={isSidebarCollapsed ? "User Management" : ""}
            >
              <Users className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "User Management"}
            </Button>
            <Button
              variant={selectedTab === 'student-approval' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSelectedTab('student-approval')}
              data-testid="button-tab-student-approval"
              title={isSidebarCollapsed ? "Student Approval" : ""}
            >
              <UserCheck className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Student Approval"}
              {!isSidebarCollapsed && pendingStudents.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {pendingStudents.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={selectedTab === 'programs' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                        onClick={() => setSelectedTab('programs')}
                        data-testid="button-tab-programs"
              title={isSidebarCollapsed ? "Program Management" : ""}
            >
              <BookOpen className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Program Management"}
            </Button>
            <Button
              variant={selectedTab === 'courses' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                        onClick={() => setSelectedTab('courses')}
                        data-testid="button-tab-courses"
              title={isSidebarCollapsed ? "Course Management" : ""}
            >
              <BookOpen className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Course Management"}
            </Button>
            <Button
              variant={selectedTab === 'reports' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                        onClick={() => setSelectedTab('reports')}
                        data-testid="button-tab-reports"
              title={isSidebarCollapsed ? "Reports" : ""}
            >
              <FileText className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Reports"}
            </Button>
            <Button
              variant={selectedTab === 'llm' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSelectedTab('llm')}
              data-testid="button-tab-llm"
              title={isSidebarCollapsed ? "LLM Manager" : ""}
            >
              <Brain className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "LLM Manager"}
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
              variant="destructive" 
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              data-testid="button-logout" 
                  onClick={handleSignOut}
              title={isSidebarCollapsed ? "Logout" : ""}
                >
              <LogOut className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-2' : ''}`} />
              {!isSidebarCollapsed && "Logout"}
                </Button>
              </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="p-6">
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'users' && (
              activeAdminTab === 'users' && renderUserManagement() ||
              activeAdminTab === 'permissions' && renderPermissionsAccess() ||
              activeAdminTab === 'detection' && renderDetectionSettings() ||
              activeAdminTab === 'logs' && renderSystemLogs()
          )}
          {selectedTab === 'student-approval' && renderStudentApproval()}
          {selectedTab === 'programs' && renderProgramManagement()}
            {selectedTab === 'courses' && renderCourseManagement()}
          {selectedTab === 'reports' && renderReports()}
          {selectedTab === 'llm' && <LLMManager />}
            {selectedTab === 'settings' && renderSettings()}
          </div>
            </main>
        </div>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Add Students Modal */}
      <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Students to {selectedCourse?.title}</DialogTitle>
            <DialogDescription>
              Select students to enroll in this course.
            </DialogDescription>
          </DialogHeader>
          
          {studentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading available students...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {allStudents.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No available students to add to this course.
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {allStudents.map((student) => (
                      <div key={student.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                        <input
                          type="checkbox"
                          id={student.id}
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-sm text-muted-foreground">{student.email}</div>
                          {student.studentId && (
                            <div className="text-xs text-muted-foreground">ID: {student.studentId}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedStudents.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedStudents.length} student(s) selected
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddStudentModalOpen(false);
              setSelectedStudents([]);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddStudentsToCourse}
              disabled={selectedStudents.length === 0}
            >
              Add {selectedStudents.length} Student(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={(open) => {
        setIsAddUserModalOpen(open);
        if (!open) resetUserForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Instructor</DialogTitle>
            <DialogDescription>
              Create a new instructor account in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={userForm.firstName || ''}
                onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={userForm.lastName || ''}
                onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                placeholder="Enter last name"
              />
      </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={userForm.password || ''}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label>Assign to Programs</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {programs.length === 0 ? (
                  <p className="text-sm text-gray-500">No programs available</p>
                ) : (
                  programs.map((program) => (
                    <label key={program.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={userForm.assignedPrograms.includes(program.id)}
                        onChange={() => handleProgramToggle(program.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{program.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddUserModalOpen(false);
              resetUserForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={(open) => {
        setIsEditUserModalOpen(open);
        if (!open) resetUserForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                value={userForm.firstName}
                onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={userForm.lastName}
                onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                placeholder="Enter last name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                placeholder="Enter new password (optional)"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={userForm.isActive ? "Active" : "Inactive"} 
                onValueChange={(value) => setUserForm({...userForm, isActive: value === "Active"})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          {selectedUser?.role === 'instructor' && (
            <div>
              <Label>Assign to Programs</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {isLoadingInstructorPrograms ? (
                  <p className="text-sm text-gray-500">Loading programs...</p>
                ) : programs.length === 0 ? (
                  <p className="text-sm text-gray-500">No programs available</p>
                ) : (
                  programs.map((program) => (
                    <label key={program.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={userForm.assignedPrograms.includes(program.id)}
                        onChange={() => handleProgramToggle(program.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{program.name}</span>
                    </label>
                  ))
                )}
            </div>
            </div>
          )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditUserModalOpen(false);
              resetUserForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. If the user has existing data (courses, assignments, etc.), they will be deactivated instead of deleted. This will permanently delete the user account for {selectedUser?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* System Settings Modal */}
      <Dialog open={isSystemSettingsOpen} onOpenChange={setIsSystemSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>System Settings</DialogTitle>
            <DialogDescription>
              Configure system-wide settings and preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>System Name</Label>
              <Input placeholder="CHECKmate Learning Management System" />
            </div>
            <div className="space-y-2">
              <Label>Plagiarism Detection Sensitivity</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Auto-grading Settings</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-grade" defaultChecked />
                  <Label htmlFor="auto-grade">Enable automatic grading</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="ai-feedback" defaultChecked />
                  <Label htmlFor="ai-feedback">Enable AI-generated feedback</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSystemSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsSystemSettingsOpen(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Edit Course Modal */}
      <Dialog open={isEditCourseModalOpen} onOpenChange={setIsEditCourseModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-course-name">Course Name</Label>
                <Input
                  id="edit-course-name"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <Label htmlFor="edit-course-code">Course Code</Label>
                <Input
                  id="edit-course-code"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                  placeholder="e.g., CS101"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-course-description">Description</Label>
              <Textarea
                id="edit-course-description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="Enter course description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-instructor">Instructor</Label>
                <Input
                  id="edit-instructor"
                  value={courseForm.instructor}
                  onChange={(e) => setCourseForm({...courseForm, instructor: e.target.value})}
                  placeholder="Instructor name"
                />
              </div>
              <div>
                <Label htmlFor="edit-max-students">Max Students</Label>
                <Input
                  id="edit-max-students"
                  type="number"
                  value={courseForm.maxStudents}
                  onChange={(e) => setCourseForm({...courseForm, maxStudents: parseInt(e.target.value) || 50})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start-date">Start Date</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={courseForm.startDate}
                  onChange={(e) => setCourseForm({...courseForm, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-end-date">End Date</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={courseForm.endDate}
                  onChange={(e) => setCourseForm({...courseForm, endDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-course-status">Status</Label>
              <Select value={courseForm.status} onValueChange={(value) => setCourseForm({...courseForm, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCourseModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCourse}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollment Management Modal */}
      <Dialog open={isEnrollmentModalOpen} onOpenChange={setIsEnrollmentModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Enrollment - {selectedCourse?.title}</DialogTitle>
            <DialogDescription>
              Manage student enrollments and instructor assignments for this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Enrolled Students ({enrolledStudents.length})</h3>
                  <Button 
                    size="sm" 
                    onClick={() => setIsAddStudentModalOpen(true)}
                    className="h-8"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Add Students
                  </Button>
                </div>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {enrolledStudentsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading students...</p>
                      </div>
                    </div>
                  ) : enrolledStudents.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No students enrolled yet</p>
                    </div>
                  ) : (
                  <div className="space-y-2">
                      {enrolledStudents.map((enrollment: any) => (
                        <div key={enrollment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium">
                              {enrollment.student?.firstName} {enrollment.student?.lastName}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {enrollment.student?.studentId} • {enrollment.student?.email}
                            </p>
                    </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveEnrollment(enrollment.id)}>
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                      ))}
                    </div>
                  )}
                  </div>
              </div>
              <div>
                <h3 className="font-medium mb-3">Course Instructor</h3>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {instructorLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading instructor...</p>
                    </div>
                  </div>
                  ) : !courseInstructor ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No instructor assigned</p>
                </div>
                  ) : (
                    <div className="p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium">
                          {courseInstructor.instructor?.firstName} {courseInstructor.instructor?.lastName}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {courseInstructor.instructor?.email}
                        </p>
              </div>
            </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollmentModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setIsEnrollmentModalOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Transcript Modal */}
      <Dialog open={isTranscriptModalOpen} onOpenChange={setIsTranscriptModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Student Transcript - {selectedStudent?.studentName}</DialogTitle>
            <DialogDescription>
              Complete academic record and progress summary
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Header */}
              <div className="border-b pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedStudent.studentName}</h3>
                    <p className="text-muted-foreground">Student ID: {selectedStudent.studentId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Current Grade</p>
                    <p className="text-2xl font-bold text-green-600">{selectedStudent.currentGrade}%</p>
                  </div>
                </div>
              </div>

              {/* Course Information */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Course Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Course:</span>
                      <span className="text-sm font-medium">{selectedStudent.courseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Progress:</span>
                      <span className="text-sm font-medium">{selectedStudent.progressPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Modules Completed:</span>
                      <span className="text-sm font-medium">{selectedStudent.modulesCompleted}/{selectedStudent.totalModules}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activity Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Time Spent:</span>
                      <span className="text-sm font-medium">{selectedStudent.timeSpent} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Assignments:</span>
                      <span className="text-sm font-medium">{selectedStudent.assignmentsSubmitted} submitted</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Quizzes:</span>
                      <span className="text-sm font-medium">{selectedStudent.quizzesCompleted} completed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Discussions:</span>
                      <span className="text-sm font-medium">{selectedStudent.discussionPosts} posts</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Module Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm font-bold">{selectedStudent.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-600 h-4 rounded-full flex items-center justify-center text-white text-xs font-medium" 
                        style={{ width: `${selectedStudent.progressPercentage}%` }}
                      >
                        {selectedStudent.progressPercentage}%
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{selectedStudent.modulesCompleted}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">{selectedStudent.totalModules - selectedStudent.modulesCompleted}</div>
                        <div className="text-xs text-muted-foreground">Remaining</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{selectedStudent.totalModules}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grade Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Grade Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Current Overall Grade</span>
                      <span className="text-xl font-bold text-green-600">{selectedStudent.currentGrade}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Assignments</span>
                        <span className="font-medium">88%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Quizzes</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Participation</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Final Exam</span>
                        <span className="font-medium">Pending</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTranscriptModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {/* Handle download transcript */}}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Program Modal */}
      <Dialog open={isAddProgramModalOpen} onOpenChange={setIsAddProgramModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Program</DialogTitle>
            <DialogDescription>
              Create a new academic program in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="programName">Program Name</Label>
              <Input
                id="programName"
                value={programForm.name}
                onChange={(e) => setProgramForm({...programForm, name: e.target.value})}
                placeholder="e.g., Bachelor of Science in Computer Studies"
              />
            </div>
            <div>
              <Label htmlFor="programCode">Program Code</Label>
              <Input
                id="programCode"
                value={programForm.code}
                onChange={(e) => setProgramForm({...programForm, code: e.target.value})}
                placeholder="e.g., BSCS"
              />
            </div>
            <div>
              <Label htmlFor="programDescription">Description</Label>
              <Textarea
                id="programDescription"
                value={programForm.description}
                onChange={(e) => setProgramForm({...programForm, description: e.target.value})}
                placeholder="Program description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProgramModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProgram}>
              Add Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Program Modal */}
      <Dialog open={isEditProgramModalOpen} onOpenChange={setIsEditProgramModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>
              Update the program information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editProgramName">Program Name</Label>
              <Input
                id="editProgramName"
                value={programForm.name}
                onChange={(e) => setProgramForm({...programForm, name: e.target.value})}
                placeholder="e.g., Bachelor of Science in Computer Studies"
              />
            </div>
            <div>
              <Label htmlFor="editProgramCode">Program Code</Label>
              <Input
                id="editProgramCode"
                value={programForm.code}
                onChange={(e) => setProgramForm({...programForm, code: e.target.value})}
                placeholder="e.g., BSCS"
              />
            </div>
            <div>
              <Label htmlFor="editProgramDescription">Description</Label>
              <Textarea
                id="editProgramDescription"
                value={programForm.description}
                onChange={(e) => setProgramForm({...programForm, description: e.target.value})}
                placeholder="Program description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProgramModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProgram}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Analytics Modal */}
      <Dialog open={isAIAnalyticsOpen} onOpenChange={setIsAIAnalyticsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analytics Dashboard
            </DialogTitle>
            <DialogDescription>
              Comprehensive AI usage statistics and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {aiAnalyticsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading AI analytics...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* AI Usage Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{aiAnalytics.totalSubmissions}</div>
                    <p className="text-xs text-muted-foreground">All time submissions</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">AI Graded</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{aiAnalytics.aiGradedSubmissions}</div>
                    <p className="text-xs text-muted-foreground">Automatically graded</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">AI Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{Math.round(aiAnalytics.aiUsagePercentage)}%</div>
                    <p className="text-xs text-muted-foreground">Efficiency rate</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{aiAnalytics.avgConfidence}%</div>
                    <p className="text-xs text-muted-foreground">AI accuracy</p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Processing Time</span>
                      <span className="text-sm text-muted-foreground">{aiAnalytics.avgProcessingTime}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Plagiarism Detected</span>
                      <span className="text-sm text-muted-foreground">{aiAnalytics.plagiarismDetected} cases</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">AI System Status</span>
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Automatic Grading</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Plagiarism Detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Content Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Feedback Generation</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cost Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cost Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Total AI Processing Cost</p>
                      <p className="text-xs text-muted-foreground">Since system deployment</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">$0.00</p>
                      <p className="text-xs text-muted-foreground">100% Free AI System</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIAnalyticsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Program Dialog */}
      <AlertDialog open={isDeleteProgramDialogOpen} onOpenChange={setIsDeleteProgramDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProgram?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteProgram}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
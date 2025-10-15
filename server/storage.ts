import {
  users, courses, assignments, submissions, enrollments, grades, announcements, materials, programs, plagiarismReports, instructorPrograms, aiStatistics, aiConfig,
  type User, type InsertUser, type Course, type InsertCourse,
  type Assignment, type InsertAssignment, type Submission, type InsertSubmission,
  type Enrollment, type Grade, type Announcement, type InsertAnnouncement,
  type Material, type InsertMaterial, type Program, type InsertProgram,
  type InstructorProgram, type InsertInstructorProgram, type InsertAiStatistics, type InsertAiConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, inArray, or, desc, ne, notInArray } from "drizzle-orm";

// Storage interface for all CRUD operations
export interface IStorage {
  // Program operations
  getProgram(id: string): Promise<Program | undefined>;
  getAllPrograms(): Promise<Program[]>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: string, updates: Partial<Program>): Promise<Program | undefined>;
  deleteProgram(id: string): Promise<boolean>;
  
  // Instructor-Program operations
  getInstructorPrograms(instructorId: string): Promise<InstructorProgram[]>;
  assignInstructorToProgram(assignment: InsertInstructorProgram): Promise<InstructorProgram>;
  removeInstructorFromProgram(instructorId: string, programId: string): Promise<boolean>;
  getInstructorAssignedPrograms(instructorId: string): Promise<Program[]>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getActiveUsers(): Promise<User[]>;
  getArchivedUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  archiveUser(id: string): Promise<User | undefined>;
  reactivateUser(id: string): Promise<User | undefined>;
  bulkArchiveUsers(ids: string[]): Promise<number>;
  bulkReactivateUsers(ids: string[]): Promise<number>;
  bulkDeleteUsers(ids: string[]): Promise<number>;
  ensureAdminUsersActive(): Promise<void>;
  
  // Student approval operations
  approveStudent(studentId: string, approvedBy: string): Promise<User | undefined>;
  rejectStudent(studentId: string, approvedBy: string): Promise<User | undefined>;
  getPendingStudents(): Promise<User[]>;
  
  // Course operations
  getCourse(id: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  getCoursesByInstructor(instructorId: string): Promise<Course[]>;
  getCoursesByInstructorAndProgram(instructorId: string, programId: string): Promise<Course[]>;
  getEnrolledCourses(studentId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;
  archiveCourse(id: string): Promise<boolean>;
  unarchiveCourse(id: string): Promise<boolean>;
  toggleCourseStatus(id: string): Promise<boolean>;
  
  // Enrollment operations
  enrollStudent(courseId: string, studentId: string): Promise<Enrollment>;
  getEnrollments(courseId: string): Promise<Enrollment[]>;
  getCourseEnrollments(courseId: string): Promise<any[]>;
  getCourseInstructor(courseId: string): Promise<any | undefined>;
  createEnrollment(courseId: string, studentId: string): Promise<any>;
  deleteEnrollment(enrollmentId: string): Promise<boolean>;
  getAvailableStudents(courseId: string): Promise<User[]>;
  getStudentAssignmentsDue(studentId: string): Promise<number>;
  getStudentStudyStatistics(studentId: string): Promise<{
    assignmentsCompleted: number;
    quizzesTaken: number;
    totalStudyHours: number;
    currentStreak: number;
  }>;
  getStudentEnrolledCourses(studentId: string): Promise<any[]>;
  getInstructorCourses(instructorId: string): Promise<any[]>;
  getAdminStatistics(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalInstructors: number;
    totalAdmins: number;
    totalCourses: number;
    activeCourses: number;
    totalAssignments: number;
    plagiarismReports: number;
    aiGradingUsage: number;
  }>;
  
      // AI Analytics methods
      updateSubmissionWithAI(submissionId: string, aiData: {
        aiGraded: boolean;
        aiConfidence?: number;
        aiProcessingTime?: number;
      }): Promise<void>;
      getAIStatistics(): Promise<{
        totalSubmissions: number;
        aiGradedSubmissions: number;
        aiUsagePercentage: number;
        avgConfidence: number;
        avgProcessingTime: number;
        plagiarismDetected: number;
      }>;
      incrementAIGradingCount(assignmentId: string): Promise<void>;
      
      // AI Configuration methods
      getAIConfig(): Promise<Record<string, any>>;
      updateAIConfig(key: string, value: string): Promise<void>;
      resetAIConfigToDefaults(): Promise<void>;
  
  // Assignment operations
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAssignmentsByCourse(courseId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: string): Promise<boolean>;
  
  // Submission operations
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  getRecentSubmissionsByCourse(courseId: string): Promise<any[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined>;
  
  // Grade operations
  getGradeBySubmission(submissionId: string): Promise<Grade | undefined>;
  createGrade(grade: Omit<Grade, 'id' | 'createdAt'>): Promise<Grade>;
  
  // Announcement operations
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  getAnnouncementsByCourse(courseId: string): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<boolean>;
  
  // Material operations
  getMaterial(id: string): Promise<Material | undefined>;
  getMaterialsByCourse(courseId: string): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, updates: Partial<Material>): Promise<Material | undefined>;
  deleteMaterial(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Program operations
  async getProgram(id: string): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program || undefined;
  }

  async getAllPrograms(): Promise<Program[]> {
    return await db.select().from(programs).orderBy(programs.name);
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [newProgram] = await db.insert(programs).values(program).returning();
    return newProgram;
  }

  async updateProgram(id: string, updates: Partial<Program>): Promise<Program | undefined> {
    const [updatedProgram] = await db
      .update(programs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(programs.id, id))
      .returning();
    return updatedProgram || undefined;
  }

  async deleteProgram(id: string): Promise<boolean> {
    const result = await db.delete(programs).where(eq(programs.id, id));
    return result.rowCount > 0;
  }

  // Instructor-Program operations
  async getInstructorPrograms(instructorId: string): Promise<InstructorProgram[]> {
    return await db.select().from(instructorPrograms)
      .where(and(eq(instructorPrograms.instructorId, instructorId), eq(instructorPrograms.isActive, true)));
  }

  async assignInstructorToProgram(assignment: InsertInstructorProgram): Promise<InstructorProgram> {
    const [newAssignment] = await db.insert(instructorPrograms).values(assignment).returning();
    return newAssignment;
  }

  async removeInstructorFromProgram(instructorId: string, programId: string): Promise<boolean> {
    const result = await db.delete(instructorPrograms)
      .where(and(eq(instructorPrograms.instructorId, instructorId), eq(instructorPrograms.programId, programId)));
    return result.rowCount > 0;
  }

  async getInstructorAssignedPrograms(instructorId: string): Promise<Program[]> {
    return await db.select({ program: programs })
      .from(instructorPrograms)
      .innerJoin(programs, eq(instructorPrograms.programId, programs.id))
      .where(and(eq(instructorPrograms.instructorId, instructorId), eq(instructorPrograms.isActive, true)))
      .then(results => results.map(r => r.program));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users)
      .where(
        or(
          ne(users.role, 'student'),
          and(
            eq(users.role, 'student'),
            eq(users.approvalStatus, 'approved')
          )
        )
      )
      .orderBy(users.firstName, users.lastName);
  }

  async getActiveUsers(): Promise<User[]> {
    return await db.select().from(users)
      .where(and(
        eq(users.isActive, true), 
        eq(users.isArchived, false),
        or(
          ne(users.role, 'student'),
          and(
            eq(users.role, 'student'),
            eq(users.approvalStatus, 'approved')
          )
        )
      ))
      .orderBy(users.firstName, users.lastName);
  }

  async getArchivedUsers(): Promise<User[]> {
    return await db.select().from(users)
      .where(and(
        eq(users.isArchived, true),
        or(
          ne(users.role, 'student'),
          and(
            eq(users.role, 'student'),
            eq(users.approvalStatus, 'approved')
          )
        )
      ))
      .orderBy(users.archivedAt);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate 6-digit Student ID for students if not provided
    let studentId = insertUser.studentId;
    if (insertUser.role === 'student' && !studentId) {
      studentId = await this.generateStudentId();
    }

    // Set approval status based on role
    const approvalStatus = insertUser.role === 'student' ? 'pending' : 'approved';

    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role as 'student' | 'instructor' | 'administrator',
        studentId: studentId || null,
        yearLevel: insertUser.yearLevel || null,
        programId: insertUser.programId || null,
        approvalStatus: approvalStatus,
        approvedAt: approvalStatus === 'approved' ? new Date() : null,
      })
      .returning();
    return user;
  }

  private async generateStudentId(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      // Generate a random 6-digit number
      const studentId = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Check if this Student ID already exists
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.studentId, studentId))
        .limit(1);
      
      if (existingUser.length === 0) {
        return studentId;
      }
      
      attempts++;
    }
    
    // If we can't generate a unique ID after maxAttempts, throw an error
    throw new Error('Unable to generate unique Student ID. Please try again.');
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // Get the user first to check if they're an admin
      const user = await this.getUser(id);
      if (!user) {
        return false;
      }
      
      // Prevent deleting admin users
      if (user.role === 'administrator') {
        throw new Error('Cannot delete administrator accounts');
      }

      // For inactive users, use force delete with comprehensive cascade
      if (!user.isActive) {
        return await this.forceDeleteInactiveUser(id);
      }
      
      // Get all courses taught by this user first
      const userCourses = await db.select().from(courses).where(eq(courses.instructorId, id));
      
      // For each course, delete all related data
      for (const course of userCourses) {
        // Delete grades for submissions in this course
        const courseSubmissions = await db.select().from(submissions)
          .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
          .where(eq(assignments.courseId, course.id));
        
        for (const submission of courseSubmissions) {
          await db.delete(grades).where(eq(grades.submissionId, submission.submissions.id));
        }
        
        // Delete plagiarism reports for submissions in this course
        for (const submission of courseSubmissions) {
          await db.delete(plagiarismReports).where(eq(plagiarismReports.submissionId, submission.submissions.id));
        }
        
        // Delete submissions for assignments in this course
        await db.delete(submissions)
          .where(sql`assignment_id IN (SELECT id FROM assignments WHERE course_id = ${course.id})`);
        
        // Delete assignments for this course
        await db.delete(assignments).where(eq(assignments.courseId, course.id));
        
        // Delete announcements for this course
        await db.delete(announcements).where(eq(announcements.courseId, course.id));
        
        // Delete materials for this course
        await db.delete(materials).where(eq(materials.courseId, course.id));
        
        // Delete enrollments for this course
        await db.delete(enrollments).where(eq(enrollments.courseId, course.id));
      }
      
      // Delete courses taught by this user
      await db.delete(courses).where(eq(courses.instructorId, id));
      
      // Delete announcements created by this user (if any remain)
      await db.delete(announcements).where(eq(announcements.createdBy, id));
      
      // Delete materials created by this user (if any remain)
      await db.delete(materials).where(eq(materials.createdBy, id));
      
      // Delete submissions by this user (if any remain)
      await db.delete(submissions).where(eq(submissions.studentId, id));
      
      // Delete enrollments for this user (if any remain)
      await db.delete(enrollments).where(eq(enrollments.studentId, id));
      
      // Finally delete the user
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Force delete inactive users with comprehensive cascade deletion
  private async forceDeleteInactiveUser(id: string): Promise<boolean> {
    try {
      console.log(`Force deleting inactive user: ${id}`);
      
      // Simple approach - just delete the user and let cascade handle it
      // If cascade fails, we'll catch it and handle manually
      
      // Try direct delete first
      const result = await db.delete(users).where(eq(users.id, id));
      
      if (result.rowCount > 0) {
        console.log(`Successfully force deleted inactive user: ${id}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error force deleting inactive user ${id}:`, error);
      throw error;
    }
  }

  async archiveUser(id: string): Promise<User | undefined> {
    // Get the user first to check if they're an admin
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Prevent archiving admin users
    if (user.role === 'administrator') {
      throw new Error('Cannot archive administrator accounts');
    }
    
    const [archivedUser] = await db
      .update(users)
      .set({ 
        isArchived: true, 
        archivedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return archivedUser || undefined;
  }

  async reactivateUser(id: string): Promise<User | undefined> {
    const [reactivatedUser] = await db
      .update(users)
      .set({ 
        isActive: true,
        isArchived: false, 
        archivedAt: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return reactivatedUser || undefined;
  }

  async approveStudent(studentId: string, approvedBy: string): Promise<User | undefined> {
    const [approvedUser] = await db
      .update(users)
      .set({ 
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: approvedBy,
        updatedAt: new Date() 
      })
      .where(and(eq(users.id, studentId), eq(users.role, 'student')))
      .returning();
    return approvedUser || undefined;
  }

  async rejectStudent(studentId: string, approvedBy: string): Promise<User | undefined> {
    const [rejectedUser] = await db
      .update(users)
      .set({ 
        approvalStatus: 'rejected',
        approvedAt: new Date(),
        approvedBy: approvedBy,
        updatedAt: new Date() 
      })
      .where(and(eq(users.id, studentId), eq(users.role, 'student')))
      .returning();
    return rejectedUser || undefined;
  }

  async getPendingStudents(): Promise<User[]> {
    return await db.select().from(users)
      .where(and(
        eq(users.role, 'student'),
        eq(users.approvalStatus, 'pending'),
        eq(users.isArchived, false)
      ))
      .orderBy(users.createdAt);
  }

  async bulkArchiveUsers(ids: string[]): Promise<number> {
    // First, get all users to filter out administrators
    const usersToArchive = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        inArray(users.id, ids),
        sql`${users.role} != 'administrator'`
      ));
    
    if (usersToArchive.length === 0) {
      return 0;
    }
    
    const adminIds = ids.filter(id => !usersToArchive.some(u => u.id === id));
    if (adminIds.length > 0) {
      console.warn(`Skipped archiving ${adminIds.length} administrator account(s)`);
    }
    
    const result = await db
      .update(users)
      .set({ 
        isArchived: true, 
        archivedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(inArray(users.id, usersToArchive.map(u => u.id)));
    return result.rowCount;
  }

  async bulkReactivateUsers(ids: string[]): Promise<number> {
    const result = await db
      .update(users)
      .set({ 
        isActive: true,
        isArchived: false, 
        archivedAt: null,
        updatedAt: new Date() 
      })
      .where(inArray(users.id, ids));
    return result.rowCount;
  }

  async bulkDeleteUsers(ids: string[]): Promise<number> {
    let deletedCount = 0;
    let skippedAdmins = 0;
    
    for (const id of ids) {
      try {
        const user = await this.getUser(id);
        if (!user) continue;
        
        // Skip admin users
        if (user.role === 'administrator') {
          skippedAdmins++;
          console.warn(`Skipped deleting administrator account: ${user.email}`);
          continue;
        }
        
        const deleted = await this.deleteUser(id);
        if (deleted) deletedCount++;
      } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        // Try to deactivate instead
        try {
          await this.archiveUser(id);
          deletedCount++;
        } catch (archiveError) {
          console.error(`Error archiving user ${id}:`, archiveError);
        }
      }
    }
    
    if (skippedAdmins > 0) {
      console.warn(`Skipped deleting ${skippedAdmins} administrator account(s)`);
    }
    
    return deletedCount;
  }

  async ensureAdminUsersActive(): Promise<void> {
    // Ensure all administrator accounts are always active and unarchived
    await db
      .update(users)
      .set({ 
        isActive: true,
        isArchived: false,
        archivedAt: null,
        updatedAt: new Date()
      })
      .where(sql`${users.role} = 'administrator'`);
  }

  // Course operations
  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.instructorId, instructorId));
  }

  async getCoursesByInstructorAndProgram(instructorId: string, programId: string): Promise<Course[]> {
    return await db.select().from(courses)
      .where(and(eq(courses.instructorId, instructorId), eq(courses.programId, programId)));
  }

  async getEnrolledCourses(studentId: string): Promise<Course[]> {
    return await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        code: courses.code,
        section: courses.section,
        instructorId: courses.instructorId,
        programId: courses.programId,
        isActive: courses.isActive,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .innerJoin(enrollments, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.studentId, studentId));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse || undefined;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return result.rowCount > 0;
  }

  async archiveCourse(id: string): Promise<boolean> {
    try {
      await db
        .update(courses)
        .set({
          isArchived: true,
          archivedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(courses.id, id));
      return true;
    } catch (error) {
      console.error('Error archiving course:', error);
      return false;
    }
  }

  async unarchiveCourse(id: string): Promise<boolean> {
    try {
      await db
        .update(courses)
        .set({
          isArchived: false,
          archivedAt: null,
          updatedAt: new Date()
        })
        .where(eq(courses.id, id));
      return true;
    } catch (error) {
      console.error('Error unarchiving course:', error);
      return false;
    }
  }

  async toggleCourseStatus(id: string): Promise<boolean> {
    try {
      // Get current course status
      const [course] = await db.select().from(courses).where(eq(courses.id, id));
      if (!course) {
        return false;
      }

      // Toggle the status
      await db
        .update(courses)
        .set({
          isActive: !course.isActive,
          updatedAt: new Date()
        })
        .where(eq(courses.id, id));
      return true;
    } catch (error) {
      console.error('Error toggling course status:', error);
      return false;
    }
  }

  // Enrollment operations
  async enrollStudent(courseId: string, studentId: string): Promise<Enrollment> {
    const [enrollment] = await db
      .insert(enrollments)
      .values({ courseId, studentId })
      .returning();
    return enrollment;
  }

  async getEnrollments(courseId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async getCourseEnrollments(courseId: string): Promise<any[]> {
    return await db
      .select({
        id: enrollments.id,
        enrolledAt: enrollments.enrolledAt,
        student: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          studentId: users.studentId,
        }
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(eq(enrollments.courseId, courseId));
  }

  async getCourseInstructor(courseId: string): Promise<any | undefined> {
    const [result] = await db
      .select({
        instructor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(courses)
      .innerJoin(users, eq(courses.instructorId, users.id))
      .where(eq(courses.id, courseId));
    return result;
  }

  async getStudentAssignmentsDue(studentId: string): Promise<number> {
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(assignments)
      .innerJoin(enrollments, eq(assignments.courseId, enrollments.courseId))
      .where(
        and(
          eq(enrollments.studentId, studentId),
          sql`${assignments.dueDate} <= ${oneWeekFromNow}`,
          sql`${assignments.dueDate} >= NOW()`
        )
      );
    
    return result[0]?.count || 0;
  }

  async getStudentStudyStatistics(studentId: string): Promise<{
    assignmentsCompleted: number;
    quizzesTaken: number;
    totalStudyHours: number;
    currentStreak: number;
  }> {
    // Get assignments completed (submissions with grades)
    const assignmentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(enrollments, eq(assignments.courseId, enrollments.courseId))
      .innerJoin(grades, eq(submissions.id, grades.submissionId))
      .where(eq(enrollments.studentId, studentId));
    
    // Get total submissions (including quizzes if we had a quiz table)
    const submissionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(enrollments, eq(assignments.courseId, enrollments.courseId))
      .where(eq(enrollments.studentId, studentId));
    
    // For now, we'll use mock data for study hours and streak since we don't have those tables yet
    // In a real system, you'd have study_sessions and activity_logs tables
    const assignmentsCompleted = assignmentsResult[0]?.count || 0;
    const quizzesTaken = submissionsResult[0]?.count || 0; // Using total submissions as proxy
    
    return {
      assignmentsCompleted,
      quizzesTaken,
      totalStudyHours: 0, // Would come from study_sessions table
      currentStreak: 0,   // Would come from activity_logs table
    };
  }

  async getStudentEnrolledCourses(studentId: string): Promise<any[]> {
    return await db
      .select({
        id: courses.id,
        title: courses.title,
        code: courses.code,
        description: courses.description,
        section: courses.section,
        maxStudents: courses.maxStudents,
        startDate: courses.startDate,
        endDate: courses.endDate,
        status: courses.status,
        enrolledAt: enrollments.enrolledAt,
        instructor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(users, eq(courses.instructorId, users.id))
      .where(eq(enrollments.studentId, studentId))
      .orderBy(desc(enrollments.enrolledAt));
  }

  async getInstructorCourses(instructorId: string): Promise<any[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.instructorId, instructorId))
      .orderBy(desc(courses.createdAt));
  }

  async getAdminStatistics(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalInstructors: number;
    totalAdmins: number;
    totalCourses: number;
    activeCourses: number;
    totalAssignments: number;
    plagiarismReports: number;
    aiGradingUsage: number;
  }> {
    // Get user counts by role
    const userCounts = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(eq(users.isArchived, false))
      .groupBy(users.role);

    const roleCounts = userCounts.reduce((acc, row) => {
      acc[row.role] = row.count;
      return acc;
    }, {} as Record<string, number>);

    // Get course counts
    const courseCounts = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where is_active = true)`
      })
      .from(courses);

    // Get assignment count
    const assignmentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(assignments);

    // Get plagiarism reports count (if table exists)
    const plagiarismCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(plagiarismReports);

    // Get AI grading usage statistics
    const aiStats = await this.getAIStatistics();

    return {
      totalUsers: roleCounts.student + roleCounts.instructor + roleCounts.administrator || 0,
      totalStudents: roleCounts.student || 0,
      totalInstructors: roleCounts.instructor || 0,
      totalAdmins: roleCounts.administrator || 0,
      totalCourses: courseCounts[0]?.total || 0,
      activeCourses: courseCounts[0]?.active || 0,
      totalAssignments: assignmentCount[0]?.count || 0,
      plagiarismReports: plagiarismCount[0]?.count || 0,
      aiGradingUsage: Math.round(aiStats.aiUsagePercentage),
    };
  }

  // Assignment operations
  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment || undefined;
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.courseId, courseId));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    console.log("Creating assignment with data:", assignment);
    
    // Use raw SQL to bypass Drizzle timestamp issues
    const result = await db.execute(sql`
      INSERT INTO assignments (title, description, course_id, max_score, is_published, due_date, created_at, updated_at)
      VALUES (${assignment.title}, ${assignment.description}, ${assignment.courseId}, ${assignment.maxScore}, ${assignment.isPublished}, ${assignment.dueDate || null}, NOW(), NOW())
      RETURNING *
    `);
    
    return result.rows[0] as Assignment;
  }

  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | undefined> {
    const [updatedAssignment] = await db
      .update(assignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return updatedAssignment || undefined;
  }

  async deleteAssignment(id: string): Promise<boolean> {
    try {
      // Delete related grades first
      const assignmentSubmissions = await db.select().from(submissions).where(eq(submissions.assignmentId, id));
      for (const submission of assignmentSubmissions) {
        await db.delete(grades).where(eq(grades.submissionId, submission.id));
      }
      
      // Delete submissions
      await db.delete(submissions).where(eq(submissions.assignmentId, id));
      
      // Delete assignment
      const result = await db.delete(assignments).where(eq(assignments.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      return false;
    }
  }

  // Submission operations
  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission || undefined;
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId));
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.studentId, studentId));
  }

  async getRecentSubmissionsByCourse(courseId: string): Promise<any[]> {
    // Get recent submissions for assignments in this course with student and assignment details
    const result = await db.select({
      id: submissions.id,
      studentId: submissions.studentId,
      assignmentId: submissions.assignmentId,
      content: submissions.content,
      status: submissions.status,
      aiGraded: submissions.aiGraded,
      aiConfidence: submissions.aiConfidence,
      aiProcessingTime: submissions.aiProcessingTime,
      aiGradedAt: submissions.aiGradedAt,
      submittedAt: submissions.submittedAt,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,
      // Student details
      studentFirstName: users.firstName,
      studentLastName: users.lastName,
      studentEmail: users.email,
      studentId: users.studentId,
      // Assignment details
      assignmentTitle: assignments.title,
      assignmentDescription: assignments.description,
      assignmentMaxScore: assignments.maxScore,
      assignmentDueDate: assignments.dueDate,
      assignmentAiGradingEnabled: assignments.aiGradingEnabled,
      // Grade details (from grades table)
      gradeScore: grades.score,
      gradeFeedback: grades.feedback,
      gradeGradedAt: grades.gradedAt,
    })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(users, eq(submissions.studentId, users.id))
      .leftJoin(grades, eq(submissions.id, grades.submissionId))
      .where(eq(assignments.courseId, courseId))
      .orderBy(desc(submissions.submittedAt))
      .limit(20); // Get last 20 submissions

    // Transform the data to match frontend expectations
    return result.map(sub => ({
      id: sub.id,
      studentId: sub.studentId, // Include studentId for AI grading
      assignmentId: sub.assignmentId, // Include assignmentId for AI grading
      studentName: `${sub.studentFirstName} ${sub.studentLastName}`,
      assignmentTitle: sub.assignmentTitle,
      content: sub.content,
      grade: sub.gradeScore,
      feedback: sub.gradeFeedback,
      aiGraded: sub.aiGraded,
      aiConfidence: sub.aiConfidence,
      aiProcessingTime: sub.aiProcessingTime,
      aiGradedAt: sub.aiGradedAt,
      submittedAt: sub.submittedAt,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      // Determine status based on grading
      status: sub.gradeScore !== null ? 'graded' : sub.status,
      // Calculate AI grade percentage if available
      aiGrade: sub.gradeScore && sub.assignmentMaxScore ? Math.round((sub.gradeScore / sub.assignmentMaxScore) * 100) : null,
      // Word count (simple approximation)
      wordCount: sub.content ? sub.content.split(' ').length : 0,
      // Course info will be added by the frontend
    }));
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(submissions.id, id))
      .returning();
    return updatedSubmission || undefined;
  }

  // Grade operations
  async getGradeBySubmission(submissionId: string): Promise<Grade | undefined> {
    const [grade] = await db.select().from(grades).where(eq(grades.submissionId, submissionId));
    return grade || undefined;
  }

  async createGrade(grade: Omit<Grade, 'id' | 'createdAt'>): Promise<Grade> {
    const [newGrade] = await db.insert(grades).values(grade).returning();
    return newGrade;
  }

  // Announcement operations
  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement || undefined;
  }

  async getAnnouncementsByCourse(courseId: string): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.courseId, courseId))
      .orderBy(announcements.createdAt);
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | undefined> {
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement || undefined;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return result.rowCount > 0;
  }

  // Material operations
  async getMaterial(id: string): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material || undefined;
  }

  async getMaterialsByCourse(courseId: string): Promise<Material[]> {
    return await db
      .select()
      .from(materials)
      .where(eq(materials.courseId, courseId))
      .orderBy(materials.orderIndex, materials.createdAt);
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db.insert(materials).values(material).returning();
    return newMaterial;
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material | undefined> {
    const [updatedMaterial] = await db
      .update(materials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(materials.id, id))
      .returning();
    return updatedMaterial || undefined;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const result = await db.delete(materials).where(eq(materials.id, id));
    return result.rowCount > 0;
  }

  // AI Analytics methods
  async updateSubmissionWithAI(submissionId: string, aiData: {
    aiGraded: boolean;
    aiConfidence?: number;
    aiProcessingTime?: number;
  }): Promise<void> {
    await db
      .update(submissions)
      .set({
        aiGraded: aiData.aiGraded,
        aiConfidence: aiData.aiConfidence?.toString(),
        aiProcessingTime: aiData.aiProcessingTime,
        aiGradedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(submissions.id, submissionId));
  }

  async getAIStatistics(): Promise<{
    totalSubmissions: number;
    aiGradedSubmissions: number;
    aiUsagePercentage: number;
    avgConfidence: number;
    avgProcessingTime: number;
    plagiarismDetected: number;
  }> {
    // Get total submissions
    const totalSubmissionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions);

    // Get AI-graded submissions
    const aiGradedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(eq(submissions.aiGraded, true));

    // Get average confidence and processing time for AI-graded submissions
    const aiMetricsResult = await db
      .select({
        avgConfidence: sql<number>`avg(cast(ai_confidence as decimal))`,
        avgProcessingTime: sql<number>`avg(ai_processing_time)`
      })
      .from(submissions)
      .where(eq(submissions.aiGraded, true));

    // Get plagiarism reports count
    const plagiarismResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(plagiarismReports);

    const totalSubmissions = totalSubmissionsResult[0]?.count || 0;
    const aiGradedSubmissions = aiGradedResult[0]?.count || 0;
    const aiUsagePercentage = totalSubmissions > 0 ? (aiGradedSubmissions / totalSubmissions) * 100 : 0;
    const avgConfidence = aiMetricsResult[0]?.avgConfidence || 0;
    const avgProcessingTime = aiMetricsResult[0]?.avgProcessingTime || 0;
    const plagiarismDetected = plagiarismResult[0]?.count || 0;

    return {
      totalSubmissions,
      aiGradedSubmissions,
      aiUsagePercentage,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      avgProcessingTime: Math.round(avgProcessingTime),
      plagiarismDetected
    };
  }

      async incrementAIGradingCount(assignmentId: string): Promise<void> {
        await db
          .update(assignments)
          .set({
            aiGradingCount: sql`ai_grading_count + 1`,
            updatedAt: new Date()
          })
          .where(eq(assignments.id, assignmentId));
      }

      // AI Configuration methods
      async getAIConfig(): Promise<Record<string, any>> {
        const configs = await db
          .select()
          .from(aiConfig)
          .where(eq(aiConfig.isActive, true));

        const config: Record<string, any> = {};
        for (const item of configs) {
          // Parse value based on expected type
          let value = item.value;
          if (item.value === 'true') value = true;
          else if (item.value === 'false') value = false;
          else if (!isNaN(Number(item.value))) value = Number(item.value);
          
          config[item.key] = value;
        }
        return config;
      }

      async updateAIConfig(key: string, value: string): Promise<void> {
        await db
          .update(aiConfig)
          .set({
            value,
            updatedAt: new Date()
          })
          .where(eq(aiConfig.key, key));
      }

      async resetAIConfigToDefaults(): Promise<void> {
        // Clear existing config
        await db.delete(aiConfig);
        
        // Insert default configurations
        const defaultConfigs: InsertAiConfig[] = [
          {
            key: 'plagiarism_sensitivity',
            value: 'medium',
            description: 'Plagiarism detection sensitivity level',
            category: 'plagiarism'
          },
          {
            key: 'plagiarism_threshold',
            value: '85',
            description: 'Auto-flag threshold percentage for plagiarism',
            category: 'plagiarism'
          },
          {
            key: 'check_external_sources',
            value: 'true',
            description: 'Whether to check external sources for plagiarism',
            category: 'plagiarism'
          },
          {
            key: 'auto_grading_enabled',
            value: 'true',
            description: 'Enable automatic AI grading',
            category: 'grading'
          },
          {
            key: 'confidence_threshold',
            value: '75',
            description: 'Minimum confidence threshold for AI grading',
            category: 'grading'
          },
          {
            key: 'human_review_required',
            value: 'true',
            description: 'Require human review for AI grades',
            category: 'grading'
          },
          {
            key: 'ai_processing_timeout',
            value: '30000',
            description: 'AI processing timeout in milliseconds',
            category: 'general'
          }
        ];

        await db.insert(aiConfig).values(defaultConfigs);
      }

      // Enrollment operations
      async createEnrollment(courseId: string, studentId: string): Promise<any> {
        const [enrollment] = await db
          .insert(enrollments)
          .values({
            courseId,
            studentId,
            enrolledAt: new Date()
          })
          .returning();

        return enrollment;
      }

      async deleteEnrollment(enrollmentId: string): Promise<boolean> {
        const result = await db
          .delete(enrollments)
          .where(eq(enrollments.id, enrollmentId));

        return result.rowCount > 0;
      }

      async getAvailableStudents(courseId: string): Promise<User[]> {
        // Get all approved students who are not enrolled in the specified course
        const enrolledStudentIds = await db
          .select({ studentId: enrollments.studentId })
          .from(enrollments)
          .where(eq(enrollments.courseId, courseId));

        const enrolledIds = enrolledStudentIds.map(e => e.studentId);

        const conditions = [
          eq(users.role, 'student'),
          eq(users.approvalStatus, 'approved'),
          eq(users.isActive, true)
        ];

        if (enrolledIds.length > 0) {
          conditions.push(notInArray(users.id, enrolledIds));
        }

        const availableStudents = await db
          .select()
          .from(users)
          .where(and(...conditions))
          .orderBy(users.firstName, users.lastName);

        return availableStudents;
      }
    }

    export const storage = new DatabaseStorage();

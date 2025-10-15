import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnnouncementSchema, insertMaterialSchema, insertSubmissionSchema } from "@shared/schema";
import { AuthService } from "./auth";
import { processSubmissionWithAI, getPlagiarismReport, getAIGrade } from "./ai";
import { checkmateAI, AIGradingResult, PlagiarismResult } from "./ai-integration";
import llmRoutes from "./llm/llm-routes.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // LLM Routes
  app.use('/api/llm', llmRoutes);

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Announcement routes
  app.get("/api/announcements/course/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      const announcements = await storage.getAnnouncementsByCourse(courseId);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    try {
      const validatedData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(validatedData);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(400).json({ error: "Failed to create announcement" });
    }
  });

  app.put("/api/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedAnnouncement = await storage.updateAnnouncement(id, req.body);
      if (!updatedAnnouncement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.json(updatedAnnouncement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(400).json({ error: "Failed to update announcement" });
    }
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAnnouncement(id);
      if (!deleted) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // Material routes
  app.get("/api/materials/course/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      const materials = await storage.getMaterialsByCourse(courseId);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      const validatedData = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      console.error("Error creating material:", error);
      res.status(400).json({ error: "Failed to create material" });
    }
  });

  app.put("/api/materials/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedMaterial = await storage.updateMaterial(id, req.body);
      if (!updatedMaterial) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(updatedMaterial);
    } catch (error) {
      console.error("Error updating material:", error);
      res.status(400).json({ error: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMaterial(id);
      if (!deleted) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ error: "Failed to delete material" });
    }
  });

  // DIRECT AI INTEGRATION ROUTES (Native CHECKmate AI)
  app.post("/api/ai/grade-submission", async (req, res) => {
    try {
      const { content, student_id, assignment_id, rubric } = req.body;
      
      if (!content || !student_id || !assignment_id || !rubric) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      console.log(`🤖 Direct AI grading for student ${student_id}`);
      
      const result = await checkmateAI.gradeSubmission(
        content,
        rubric,
        assignment_id,
        student_id
      );

      res.json({
        success: true,
        total_score: result.total_score,
        criteria_scores: result.rubric_scores,
        feedback: result.feedback,
        content_analysis: result.content_analysis,
        confidence: result.confidence,
        grading_method: result.grading_method,
        metadata: {
          processing_time: 0.5, // Native processing is very fast
          cost: "$0.00",
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Direct AI grading error:", error);
      res.status(500).json({ error: 'Direct AI grading failed' });
    }
  });

  app.post("/api/ai/detect-plagiarism", async (req, res) => {
    try {
      const { content, assignment_id, student_id } = req.body;
      
      if (!content || !assignment_id || !student_id) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      console.log(`🔍 Direct AI plagiarism detection for student ${student_id}`);
      
      const result = await checkmateAI.detectPlagiarism(
        content,
        assignment_id,
        student_id
      );

      res.json({
        similarity_scores: result.similarity_scores,
        matches: result.matches,
        highest_similarity: result.highest_similarity,
        is_flagged: result.is_flagged,
        ai_detection: result.ai_detection,
        detection_method: result.detection_method,
        metadata: {
          processing_time: 0.3,
          cost: "$0.00",
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Direct AI plagiarism detection error:", error);
      res.status(500).json({ error: 'Direct AI plagiarism detection failed' });
    }
  });

  app.get("/api/ai/analyze-content", async (req, res) => {
    try {
      const { content } = req.query;
      
      if (!content) {
        return res.status(400).json({ error: "Content parameter is required" });
      }

      console.log("📊 Direct AI content analysis");
      
      const analysis = checkmateAI.analyzeContent(content as string);
      
      res.json({
        content_analysis: analysis,
        processing_method: "checkmate_ai_direct",
        metadata: {
          processing_time: 0.1,
          cost: "$0.00",
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Direct AI content analysis error:", error);
      res.status(500).json({ error: 'Direct AI content analysis failed' });
    }
  });

  // Assignment routes
  app.get("/api/courses/:courseId/assignments", async (req, res) => {
    try {
      const { courseId } = req.params;
      const courseAssignments = await storage.getAssignmentsByCourse(courseId);
      res.json(courseAssignments);
    } catch (error) {
      console.error("Error fetching course assignments:", error);
      res.status(500).json({ error: "Failed to fetch course assignments" });
    }
  });

  app.get("/api/assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await storage.getAssignment(id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({ error: "Failed to fetch assignment" });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const assignmentData = req.body;
      const newAssignment = await storage.createAssignment(assignmentData);
      res.status(201).json(newAssignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  app.put("/api/assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedAssignment = await storage.updateAssignment(id, updates);
      if (!updatedAssignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });

  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAssignment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ error: "Failed to delete assignment" });
    }
  });

  // Submission routes
  app.get("/api/courses/:courseId/submissions/recent", async (req, res) => {
    try {
      const { courseId } = req.params;
      const submissions = await storage.getRecentSubmissionsByCourse(courseId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching recent submissions:", error);
      res.status(500).json({ error: "Failed to fetch recent submissions" });
    }
  });

  app.get("/api/submissions/assignment/:assignmentId", async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const submissions = await storage.getSubmissionsByAssignment(assignmentId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/submissions/student/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const submissions = await storage.getSubmissionsByStudent(studentId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching student submissions:", error);
      res.status(500).json({ error: "Failed to fetch student submissions" });
    }
  });

  app.get("/api/submissions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const submission = await storage.getSubmission(id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({ error: "Failed to fetch submission" });
    }
  });

  app.post("/api/submissions", async (req, res) => {
    try {
      const validatedData = insertSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(validatedData);
      
      // Process with Python AI backend if content is provided
      if (submission.content && submission.assignmentId) {
        try {
          // Get assignment details for advanced rubric
          const assignment = await storage.getAssignment(submission.assignmentId);
          const rubric = assignment?.rubric || {
            "content_quality": { "max_points": 35, "min_words": 150 },
            "grammar_style": { "max_points": 25 },
            "structure_organization": { "max_points": 25 },
            "critical_thinking": { "max_points": 15 }
          };

          // Call Python AI backend
          const pythonAIResponse = await fetch('http://localhost:8000/api/grade-submission', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: submission.content,
              student_id: submission.studentId,
              assignment_id: submission.assignmentId,
              rubric: rubric,
              assignment_type: 'essay'
            })
          });

          if (pythonAIResponse.ok) {
            const aiResult = await pythonAIResponse.json();
            // Add AI results to response
            res.status(201).json({
              ...submission,
              ai: aiResult
            });
          } else {
            throw new Error(`Python AI backend error: ${pythonAIResponse.statusText}`);
          }
        } catch (aiError) {
          console.error("Python AI processing failed:", aiError);
          // Still return the submission even if AI fails
          res.status(201).json({
            ...submission,
            ai: { error: "Python AI processing failed" }
          });
        }
      } else {
        res.status(201).json(submission);
      }
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(400).json({ error: "Failed to create submission" });
    }
  });

  app.put("/api/submissions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedSubmission = await storage.updateSubmission(id, req.body);
      if (!updatedSubmission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(400).json({ error: "Failed to update submission" });
    }
  });

  // AI-specific routes
  app.get("/api/submissions/:id/plagiarism", async (req, res) => {
    try {
      const { id } = req.params;
      const report = await getPlagiarismReport(id);
      if (!report) {
        return res.status(404).json({ error: "No plagiarism report found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching plagiarism report:", error);
      res.status(500).json({ error: "Failed to fetch plagiarism report" });
    }
  });

  app.get("/api/submissions/:id/ai-grade", async (req, res) => {
    try {
      const { id } = req.params;
      const grade = await getAIGrade(id);
      if (!grade) {
        return res.status(404).json({ error: "No AI grade found" });
      }
      res.json(grade);
    } catch (error) {
      console.error("Error fetching AI grade:", error);
      res.status(500).json({ error: "Failed to fetch AI grade" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validate request data
      const validation = AuthService.validateLoginData(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { email, password, role } = validation.data!;
      
      // Attempt login
      const result = await AuthService.login(email, password, role);
      
      if (result.success) {
        res.json({
          success: true,
          user: result.user,
          message: "Login successful"
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate request data
      const validation = AuthService.validateRegisterData(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const userData = validation.data!;
      
      // Attempt registration
      const result = await AuthService.register(userData);
      
      if (result.success) {
        const message = (userData as any).role === 'student' 
          ? "Registration successful! Your account is pending approval. You will be notified once an administrator approves your account."
          : "Registration successful";
        
        res.status(201).json({
          success: true,
          user: result.user,
          message: message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

// Archive and reactivate user routes
app.put("/api/users/:id/archive", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await storage.archiveUser(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error archiving user:", error);
    res.status(400).json({ error: "Failed to archive user" });
  }
});

app.put("/api/users/:id/reactivate", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await storage.reactivateUser(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error reactivating user:", error);
    res.status(400).json({ error: "Failed to reactivate user" });
  }
});

// Bulk operations routes
app.post("/api/users/bulk-archive", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid user IDs provided" });
    }
    const count = await storage.bulkArchiveUsers(ids);
    res.json({ message: `${count} users archived successfully`, count });
  } catch (error) {
    console.error("Error bulk archiving users:", error);
    res.status(400).json({ error: "Failed to archive users" });
  }
});

app.post("/api/users/bulk-reactivate", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid user IDs provided" });
    }
    const count = await storage.bulkReactivateUsers(ids);
    res.json({ message: `${count} users reactivated successfully`, count });
  } catch (error) {
    console.error("Error bulk reactivating users:", error);
    res.status(400).json({ error: "Failed to reactivate users" });
  }
});

app.post("/api/users/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid user IDs provided" });
    }
    const count = await storage.bulkDeleteUsers(ids);
    res.json({ message: `${count} users processed successfully`, count });
  } catch (error) {
    console.error("Error bulk deleting users:", error);
    res.status(400).json({ error: "Failed to process users" });
  }
});

// Ensure admin users are always active (fix any existing archived admins)
app.post("/api/admin/ensure-active", async (req, res) => {
  try {
    await storage.ensureAdminUsersActive();
    res.json({ message: "All administrator accounts are now active and unarchived" });
  } catch (error) {
    console.error("Error ensuring admin users are active:", error);
    res.status(500).json({ error: "Failed to ensure admin users are active" });
  }
});

// Instructor-Program assignment routes
app.get("/api/instructors/:id/programs", async (req, res) => {
  try {
    const { id } = req.params;
    const programs = await storage.getInstructorAssignedPrograms(id);
    res.json(programs);
  } catch (error) {
    console.error("Error fetching instructor programs:", error);
    res.status(500).json({ error: "Failed to fetch instructor programs" });
  }
});

app.post("/api/instructors/:id/programs", async (req, res) => {
  try {
    const { id } = req.params;
    const { programId, assignedBy } = req.body;
    const assignment = await storage.assignInstructorToProgram({
      instructorId: id,
      programId,
      assignedBy
    });
    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error assigning instructor to program:", error);
    res.status(400).json({ error: "Failed to assign instructor to program" });
  }
});

app.delete("/api/instructors/:id/programs/:programId", async (req, res) => {
  try {
    const { id, programId } = req.params;
    const deleted = await storage.removeInstructorFromProgram(id, programId);
    if (!deleted) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error removing instructor from program:", error);
    res.status(500).json({ error: "Failed to remove instructor from program" });
  }
});

// Get instructors by program
app.get("/api/instructors", async (req, res) => {
  try {
    const { programId } = req.query;
    if (programId) {
      // Get instructors assigned to this program
      const allInstructors = await storage.getAllUsers();
      const instructorUsers = allInstructors.filter(user => user.role === 'instructor');
      
      // Filter instructors by program assignment
      const assignedInstructors = [];
      for (const instructor of instructorUsers) {
        const programs = await storage.getInstructorAssignedPrograms(instructor.id);
        if (programs.some(program => program.id === programId)) {
          assignedInstructors.push(instructor);
        }
      }
      
      res.json(assignedInstructors);
    } else {
      // Return all instructors if no programId specified
      const instructors = await storage.getAllUsers();
      const instructorUsers = instructors.filter(user => user.role === 'instructor');
      res.json(instructorUsers);
    }
  } catch (error) {
    console.error("Error fetching instructors:", error);
    res.status(500).json({ error: "Failed to fetch instructors" });
  }
});

// Course management routes
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await storage.getAllCourses();
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

app.get("/api/courses/:id/enrollments", async (req, res) => {
  try {
    const { id } = req.params;
    const enrollments = await storage.getCourseEnrollments(id);
    res.json(enrollments);
  } catch (error) {
    console.error("Error fetching course enrollments:", error);
    res.status(500).json({ error: "Failed to fetch course enrollments" });
  }
});

app.get("/api/courses/:id/instructor", async (req, res) => {
  try {
    const { id } = req.params;
    const instructor = await storage.getCourseInstructor(id);
    res.json(instructor);
  } catch (error) {
    console.error("Error fetching course instructor:", error);
    res.status(500).json({ error: "Failed to fetch course instructor" });
  }
});

// Student statistics routes
app.get("/api/students/:id/assignments-due", async (req, res) => {
  try {
    const { id } = req.params;
    const assignmentsDue = await storage.getStudentAssignmentsDue(id);
    res.json({ assignmentsDue });
  } catch (error) {
    console.error("Error fetching assignments due:", error);
    res.status(500).json({ error: "Failed to fetch assignments due" });
  }
});

app.get("/api/students/:id/study-statistics", async (req, res) => {
  try {
    const { id } = req.params;
    const statistics = await storage.getStudentStudyStatistics(id);
    res.json(statistics);
  } catch (error) {
    console.error("Error fetching study statistics:", error);
    res.status(500).json({ error: "Failed to fetch study statistics" });
  }
});

// Student enrolled courses route
app.get("/api/students/:id/courses", async (req, res) => {
  try {
    const { id } = req.params;
    const courses = await storage.getStudentEnrolledCourses(id);
    res.json(courses);
  } catch (error) {
    console.error("Error fetching student courses:", error);
    res.status(500).json({ error: "Failed to fetch student courses" });
  }
});

// Instructor courses route
app.get("/api/courses/instructor/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const courses = await storage.getInstructorCourses(id);
    res.json(courses);
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({ error: "Failed to fetch instructor courses" });
  }
});

// Admin statistics route
app.get("/api/admin/stats", async (req, res) => {
  try {
    const stats = await storage.getAdminStatistics();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    res.status(500).json({ error: "Failed to fetch admin statistics" });
  }
});

// AI Analytics endpoint
app.get("/api/admin/ai-analytics", async (req, res) => {
  try {
    const aiStats = await storage.getAIStatistics();
    res.json(aiStats);
  } catch (error) {
    console.error("Error fetching AI analytics:", error);
    res.status(500).json({ error: "Failed to fetch AI analytics" });
  }
});

// AI Configuration endpoints
app.get("/api/admin/ai-config", async (req, res) => {
  try {
    const config = await storage.getAIConfig();
    res.json(config);
  } catch (error) {
    console.error("Error fetching AI config:", error);
    res.status(500).json({ error: "Failed to fetch AI configuration" });
  }
});

app.put("/api/admin/ai-config/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (!value) {
      return res.status(400).json({ error: "Value is required" });
    }
    
    await storage.updateAIConfig(key, value);
    res.json({ success: true, message: "Configuration updated successfully" });
  } catch (error) {
    console.error("Error updating AI config:", error);
    res.status(500).json({ error: "Failed to update AI configuration" });
  }
});

app.post("/api/admin/ai-config/reset", async (req, res) => {
  try {
    await storage.resetAIConfigToDefaults();
    res.json({ success: true, message: "AI configuration reset to defaults" });
  } catch (error) {
    console.error("Error resetting AI config:", error);
    res.status(500).json({ error: "Failed to reset AI configuration" });
  }
});

// Assignment creation route
app.post("/api/assignments", async (req, res) => {
  try {
    console.log("Assignment data received:", req.body);
    const { title, description, courseId, dueDate, maxScore, isPublished } = req.body;
    
    // Validate required fields
    if (!title || !description || !courseId) {
      return res.status(400).json({ error: "Missing required fields: title, description, courseId" });
    }
    
    // Check if course exists
    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(400).json({ error: "Course not found" });
    }
    
    // Create assignment data with proper dueDate handling
    const assignmentData = {
      title: String(title),
      description: String(description),
      courseId: String(courseId),
      maxScore: parseInt(maxScore) || 100,
      isPublished: Boolean(isPublished),
      dueDate: dueDate ? new Date(dueDate) : null,
    };
    
    console.log("Processed assignment data:", assignmentData);
    const assignment = await storage.createAssignment(assignmentData);
    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

app.get("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const course = await storage.getCourse(id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

app.post("/api/courses", async (req, res) => {
  try {
    const courseData = req.body;
    const course = await storage.createCourse(courseData);
    res.status(201).json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(400).json({ error: "Failed to create course" });
  }
});

app.put("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const course = await storage.updateCourse(id, updates);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(400).json({ error: "Failed to update course" });
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteCourse(id);
    if (!deleted) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// Program management routes
  app.get("/api/programs", async (req, res) => {
    try {
      const programs = await storage.getAllPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });

  app.post("/api/programs", async (req, res) => {
    try {
      const program = await storage.createProgram(req.body);
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      res.status(400).json({ error: "Failed to create program" });
    }
  });

  app.put("/api/programs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const program = await storage.updateProgram(id, req.body);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      res.json(program);
    } catch (error) {
      console.error("Error updating program:", error);
      res.status(400).json({ error: "Failed to update program" });
    }
  });

  app.delete("/api/programs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProgram(id);
      if (!deleted) {
        return res.status(404).json({ error: "Program not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ error: "Failed to delete program" });
    }
  });

// User management routes
app.get("/api/users", async (req, res) => {
  try {
    const { status } = req.query;
    let users;
    
    if (status === 'active') {
      users = await storage.getActiveUsers();
    } else if (status === 'archived') {
      users = await storage.getArchivedUsers();
    } else {
      users = await storage.getAllUsers();
    }
    
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUser(id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Health check endpoint
  // Student approval routes
  app.get("/api/admin/pending-students", async (req, res) => {
    try {
      const pendingStudents = await storage.getPendingStudents();
      res.json(pendingStudents);
    } catch (error) {
      console.error("Error fetching pending students:", error);
      res.status(500).json({ error: "Failed to fetch pending students" });
    }
  });

  app.put("/api/admin/students/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      
      if (!approvedBy) {
        return res.status(400).json({ error: "ApprovedBy is required" });
      }

      const approvedStudent = await storage.approveStudent(id, approvedBy);
      if (!approvedStudent) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json({
        success: true,
        message: "Student approved successfully",
        student: approvedStudent
      });
    } catch (error) {
      console.error("Error approving student:", error);
      res.status(500).json({ error: "Failed to approve student" });
    }
  });

  app.put("/api/admin/students/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      
      if (!approvedBy) {
        return res.status(400).json({ error: "ApprovedBy is required" });
      }

      const rejectedStudent = await storage.rejectStudent(id, approvedBy);
      if (!rejectedStudent) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json({
        success: true,
        message: "Student rejected successfully",
        student: rejectedStudent
      });
    } catch (error) {
      console.error("Error rejecting student:", error);
      res.status(500).json({ error: "Failed to reject student" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  });

  // Enrollment creation endpoint
  app.post("/api/enrollments", async (req, res) => {
    try {
      const { courseId, studentId } = req.body;
      
      if (!courseId || !studentId) {
        return res.status(400).json({ error: "Course ID and Student ID are required" });
      }
      
      const enrollment = await storage.createEnrollment(courseId, studentId);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ error: "Failed to create enrollment" });
    }
  });

  // Get available students (not enrolled in a specific course)
  app.get("/api/students/available", async (req, res) => {
    try {
      const { courseId } = req.query;
      
      if (!courseId) {
        return res.status(400).json({ error: "Course ID is required" });
      }
      
      const availableStudents = await storage.getAvailableStudents(courseId as string);
      res.json(availableStudents);
    } catch (error) {
      console.error("Error fetching available students:", error);
      res.status(500).json({ error: "Failed to fetch available students" });
    }
  });

  // Archive course
  app.put("/api/courses/:id/archive", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.archiveCourse(id);
      
      if (!success) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      res.json({ message: "Course archived successfully" });
    } catch (error) {
      console.error("Error archiving course:", error);
      res.status(500).json({ error: "Failed to archive course" });
    }
  });

  // Unarchive course
  app.put("/api/courses/:id/unarchive", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.unarchiveCourse(id);
      
      if (!success) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      res.json({ message: "Course unarchived successfully" });
    } catch (error) {
      console.error("Error unarchiving course:", error);
      res.status(500).json({ error: "Failed to unarchive course" });
    }
  });

  // Toggle course status (Active/Inactive)
  app.put("/api/courses/:id/toggle-status", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.toggleCourseStatus(id);
      
      if (!success) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      res.json({ message: "Course status updated successfully" });
    } catch (error) {
      console.error("Error toggling course status:", error);
      res.status(500).json({ error: "Failed to update course status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

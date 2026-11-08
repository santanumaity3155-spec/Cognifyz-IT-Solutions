import studentStore from '../services/studentStore.js';

/**
 * Retrieve student records
 * Admin: returns all students across all users
 * Student: returns only records created by this student (ownership scoped)
 * GET /api/students
 */
export const getAllStudents = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'Student';
    const queryOptions = {
      ...req.query,
      // Strictly scope to authenticated user ID if role is Student
      createdBy: isStudent ? req.user.id : req.query.createdBy || null,
    };

    const result = await studentStore.findAll(queryOptions);

    return res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: result.students,
      total: result.total,
      count: result.students.length,
      pagination: {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single student by ID
 * Ownership verified by verifyResourceOwnership middleware
 * GET /api/students/:id
 */
export const getStudentById = async (req, res, next) => {
  try {
    // req.student is pre-loaded and ownership-verified by middleware
    const student = req.student || (await studentStore.findById(req.params.id));
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: `Student with ID "${req.params.id}" was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student retrieved successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new student record
 * Attaches authenticated user's ID as createdBy (ignores/overrides client input)
 * POST /api/students
 */
export const createStudent = async (req, res, next) => {
  try {
    // Prevent mass-assignment / owner spoofing by stripping untrusted client fields
    const { createdBy: _ignoredCreatedBy, _id: _ignoredId, ...safePayload } = req.body || {};

    const payload = {
      ...safePayload,
      createdBy: req.user.id, // Mandatory server-assigned owner
    };

    const newStudent = await studentStore.create(payload);

    return res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      data: newStudent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing student record
 * Ownership verified by verifyResourceOwnership middleware
 * PUT /api/students/:id
 */
export const updateStudent = async (req, res, next) => {
  try {
    // Prevent client from mutating ownership (createdBy) or internal IDs
    const { createdBy: _ignoredCreatedBy, _id: _ignoredId, studentId: _ignoredStudentId, ...safeUpdateData } =
      req.body || {};

    const targetId = req.student ? req.student._id : req.params.id;
    const updated = await studentStore.update(targetId, safeUpdateData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: `Student with ID "${req.params.id}" was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a student record
 * Ownership verified by verifyResourceOwnership middleware
 * DELETE /api/students/:id
 */
export const deleteStudent = async (req, res, next) => {
  try {
    const targetId = req.student ? req.student._id : req.params.id;
    const deleted = await studentStore.delete(targetId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: `Student with ID "${req.params.id}" was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student record deleted successfully',
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin-only seed reset endpoint
 * POST /api/students/reset-seed
 */
export const resetSeed = async (req, res, next) => {
  try {
    await studentStore.resetSeedData();
    return res.status(200).json({
      success: true,
      message: 'Student seed data reset successfully.',
    });
  } catch (error) {
    next(error);
  }
};

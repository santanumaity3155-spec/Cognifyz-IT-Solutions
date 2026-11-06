import { studentStore } from '../services/studentStore.js';

/**
 * @route   GET /api/students
 * @desc    Retrieve all students with pagination, search, and filtering
 * @access  Public
 */
export const getStudents = async (req, res, next) => {
  try {
    const { search, course, academicYear, status, page, limit, sortBy, sortOrder } = req.query;

    const result = await studentStore.findAll({
      search,
      course,
      academicYear,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      count: result.students.length,
      total: result.total,
      pagination: {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      data: result.students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/students/:id
 * @desc    Retrieve single student record by ID
 * @access  Public
 */
export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing student ID',
        error: 'INVALID_ID',
      });
    }

    const student = await studentStore.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID '${id}' was not found`,
        error: 'STUDENT_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student retrieved successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/students
 * @desc    Create a new student record
 * @access  Public
 */
export const createStudent = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check for duplicate email
    const existing = await studentStore.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A student with email '${email}' already exists`,
        error: 'DUPLICATE_EMAIL',
        duplicateField: 'email',
      });
    }

    const newStudent = await studentStore.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: newStudent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/students/:id
 * @desc    Update an existing student record
 * @access  Public
 */
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    // Check if student exists
    const existing = await studentStore.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Student with ID '${id}' was not found for update`,
        error: 'STUDENT_NOT_FOUND',
      });
    }

    // If changing email, verify new email is not taken by another student
    if (email && email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const emailConflict = await studentStore.findByEmail(email);
      if (emailConflict && emailConflict._id !== existing._id) {
        return res.status(409).json({
          success: false,
          message: `Cannot update: Email '${email}' is already in use by another student`,
          error: 'DUPLICATE_EMAIL',
          duplicateField: 'email',
        });
      }
    }

    const updated = await studentStore.update(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete a student record
 * @access  Public
 */
export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await studentStore.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Student with ID '${id}' was not found for deletion`,
        error: 'STUDENT_NOT_FOUND',
      });
    }

    const deleted = await studentStore.delete(id);

    res.status(200).json({
      success: true,
      message: 'Student record deleted successfully',
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/students/reset-seed
 * @desc    Reset store data to sample seed students (for test/demo reset)
 * @access  Public
 */
export const resetSeed = async (req, res, next) => {
  try {
    const result = await studentStore.resetSeedData();
    res.status(200).json({
      success: true,
      message: 'Student dataset reset to initial 10 seed records',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


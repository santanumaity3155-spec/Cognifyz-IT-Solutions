import studentStore from '../services/studentStore.js';

/**
 * Resource Ownership Verification Middleware
 * Ensures that Student users can only access and mutate student records
 * they personally created (where student.createdBy === req.user.id).
 * Admin users are granted universal access to inspect and manage all records.
 * 
 * @param {string} paramKey - URL parameter containing the student ID (default: 'id')
 */
export const verifyResourceOwnership = (paramKey = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required before checking resource ownership.',
        });
      }

      const recordId = req.params[paramKey];
      if (!recordId) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_ID',
          message: 'Target resource ID parameter is required.',
        });
      }

      // Fetch the target student record
      const student = await studentStore.findById(recordId);

      // Return 404 if record does not exist
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'STUDENT_NOT_FOUND',
          message: `Student with identifier "${recordId}" was not found.`,
        });
      }

      // 1. Admin users possess full access to all records
      if (req.user.role === 'Admin') {
        req.student = student;
        return next();
      }

      // 2. Student users must own the record via createdBy
      const ownerId = student.createdBy?._id
        ? student.createdBy._id.toString()
        : student.createdBy
        ? student.createdBy.toString()
        : null;

      const currentUserId = req.user.id ? req.user.id.toString() : null;

      if (!ownerId || ownerId !== currentUserId) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN_RESOURCE',
          message: 'Access denied: You do not have permission to view, modify, or delete another student\'s record.',
        });
      }

      // Attach the verified record to the request for controller efficiency
      req.student = student;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default verifyResourceOwnership;


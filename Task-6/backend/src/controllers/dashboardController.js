import studentStore from '../services/studentStore.js';

/**
 * Retrieve dashboard analytics
 * Admin: receives system-wide statistics across all students
 * Student: receives statistics scoped strictly to their own created student records
 * GET /api/dashboard/stats
 */
export const getStats = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'Student';
    const stats = await studentStore.getDashboardStats({
      createdBy: isStudent ? req.user.id : null,
    });

    return res.status(200).json({
      success: true,
      message: isStudent ? 'Personal student analytics retrieved successfully' : 'System-wide analytics retrieved successfully',
      data: {
        ...stats,
        scope: isStudent ? 'personal' : 'global',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin-only comprehensive overview
 * GET /api/dashboard/admin-overview
 */
export const getAdminOverview = async (req, res, next) => {
  try {
    const stats = await studentStore.getDashboardStats();

    return res.status(200).json({
      success: true,
      message: 'Administrative overview retrieved successfully',
      data: {
        ...stats,
        scope: 'administrative',
        audit: {
          requestedBy: req.user.email,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

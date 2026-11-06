import { studentStore } from '../services/studentStore.js';

/**
 * @route   GET /api/dashboard/stats
 * @desc    Aggregate statistics for the Forma platform dashboard
 * @access  Public
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await studentStore.getDashboardStats();

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};


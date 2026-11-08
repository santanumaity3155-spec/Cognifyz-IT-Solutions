import express from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  resetSeed,
} from '../controllers/studentController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { verifyResourceOwnership } from '../middleware/verifyResourceOwnership.js';
import { csrfProtection } from '../middleware/csrfProtection.js';

const router = express.Router();

// All student routes require active authentication
router.use(authenticateUser);

// List students: Admin sees all records, Student sees only own created records
router.get('/', getAllStudents);

// Get single student: Ownership-checked (Admin sees any, Student sees own only)
router.get('/:id', verifyResourceOwnership('id'), getStudentById);

// Create student: Both Admin & Student can create (server assigns createdBy = req.user.id)
router.post('/', csrfProtection, createStudent);

// Update student: Ownership-checked (Admin can update any, Student can update own only)
router.put('/:id', csrfProtection, verifyResourceOwnership('id'), updateStudent);

// Delete student: Ownership-checked (Admin can delete any, Student can delete own only)
router.delete('/:id', csrfProtection, verifyResourceOwnership('id'), deleteStudent);

// Admin-only seed data reset endpoint
router.post('/reset-seed', authorizeRoles('Admin'), csrfProtection, resetSeed);

export default router;

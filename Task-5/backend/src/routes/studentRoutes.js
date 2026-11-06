import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  resetSeed,
} from '../controllers/studentController.js';
import {
  validateCreateStudent,
  validateUpdateStudent,
} from '../middleware/validateStudent.js';

const router = Router();

// Retrieve all students with filtering, pagination & search
router.get('/', getStudents);

// Reset dataset to initial seeds
router.post('/reset-seed', resetSeed);

// Retrieve single student by ID
router.get('/:id', getStudentById);

// Create new student record
router.post('/', validateCreateStudent, createStudent);

// Update existing student record
router.put('/:id', validateUpdateStudent, updateStudent);

// Delete student record
router.delete('/:id', deleteStudent);

export default router;


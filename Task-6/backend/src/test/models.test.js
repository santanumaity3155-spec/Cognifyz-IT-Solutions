import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';

describe('Phase 4: User and Student Mongoose Models Test Suite', () => {
  // ==========================================
  // USER MODEL TESTS (Requirements 1-9)
  // ==========================================
  describe('User Model Validations & Lifecycle', () => {
    it('1. should successfully validate a complete, valid User document', async () => {
      const validUser = new User({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'Password123!',
        role: 'Student',
      });

      await expect(validUser.validate()).resolves.toBeUndefined();
      expect(validUser.name).toBe('Jane Doe');
      expect(validUser.email).toBe('jane.doe@example.com');
      expect(validUser.role).toBe('Student');
      expect(validUser.isActive).toBe(true);
    });

    it('2. should reject user creation when required fields are missing', async () => {
      const emptyUser = new User({});
      let validationError;

      try {
        await emptyUser.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.name.message).toBe('Name is required');
      expect(validationError.errors.email.message).toBe('Email is required');
      expect(validationError.errors.password.message).toBe('Password is required');
    });

    it('3. should reject malformed email addresses', async () => {
      const invalidEmails = ['plainaddress', 'missing@domain', '@missinguser.com', 'user@domain..com'];

      for (const email of invalidEmails) {
        const user = new User({
          name: 'Invalid Email User',
          email,
          password: 'Password123!',
        });

        await expect(user.validate()).rejects.toThrow();
      }
    });

    it('4. should reject passwords shorter than 8 characters', async () => {
      const shortPassUser = new User({
        name: 'Short Password User',
        email: 'shortpass@example.com',
        password: 'Pass1!', // Only 6 characters
      });

      let validationError;
      try {
        await shortPassUser.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.password.message).toContain('at least 8 characters long');
    });

    it('5. should securely hash the password using bcryptjs and avoid double-hashing', async () => {
      const rawPassword = 'SecurePassword2026!';
      const user = new User({
        name: 'Security Test User',
        email: 'security@example.com',
        password: rawPassword,
      });

      // Execute hashing
      const hashedPassword = await user.hashPassword();

      expect(hashedPassword).not.toBe(rawPassword);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/); // Standard bcrypt hash format
      expect(user.password).toBe(hashedPassword);

      // Verify that calling hashPassword() again on unmodified password does not re-hash
      const unchangedHash = await user.hashPassword();
      expect(unchangedHash).toBe(hashedPassword);
    });

    it('6. should correctly verify candidate passwords using comparePassword()', async () => {
      const rawPassword = 'CorrectPassword99#';
      const user = new User({
        name: 'Auth Test User',
        email: 'auth.test@example.com',
        password: rawPassword,
      });

      await user.hashPassword();

      // Compare correct password
      const isCorrectMatch = await user.comparePassword(rawPassword);
      expect(isCorrectMatch).toBe(true);

      // Compare wrong password
      const isWrongMatch = await user.comparePassword('WrongPassword123!');
      expect(isWrongMatch).toBe(false);

      // Compare empty/null password
      expect(await user.comparePassword('')).toBe(false);
      expect(await user.comparePassword(null)).toBe(false);
    });

    it('7. should exclude password hash when serialized to JSON or safe object', async () => {
      const user = new User({
        name: 'Privacy User',
        email: 'privacy@example.com',
        password: 'Password123!',
        role: 'Student',
      });

      await user.hashPassword();

      // toJSON transformation check
      const jsonUser = user.toJSON();
      expect(jsonUser).toHaveProperty('name', 'Privacy User');
      expect(jsonUser).toHaveProperty('email', 'privacy@example.com');
      expect(jsonUser.password).toBeUndefined();
      expect(jsonUser.__v).toBeUndefined();

      // toSafeObject helper check
      const safeObj = user.toSafeObject();
      expect(safeObj.password).toBeUndefined();
      expect(safeObj.email).toBe('privacy@example.com');
    });

    it('8. should default role to Student when no role is explicitly provided', () => {
      const user = new User({
        name: 'Default Role User',
        email: 'defaultrole@example.com',
        password: 'Password123!',
      });

      expect(user.role).toBe('Student');
    });

    it('9. should reject unauthorized or invalid role values', async () => {
      const invalidRoleUser = new User({
        name: 'Invalid Role User',
        email: 'invalidrole@example.com',
        password: 'Password123!',
        role: 'SuperAdmin', // Not in enum: ['Admin', 'Student']
      });

      let validationError;
      try {
        await invalidRoleUser.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.role).toBeDefined();
      expect(validationError.errors.role.message).toContain('Role must be either Admin or Student');
    });
  });

  // ==========================================
  // STUDENT MODEL TESTS (Requirements 10-16)
  // ==========================================
  describe('Student Model Validations & Relationships', () => {
    const mockUserId = new mongoose.Types.ObjectId();

    const sampleStudentData = {
      studentId: 'STU-2026-001',
      fullName: 'Alex Mercer',
      email: 'alex.mercer@example.com',
      phone: '+1 555-432-1098',
      dateOfBirth: '2003-05-14',
      gender: 'Male',
      collegeName: 'Cognifyz Institute of Technology',
      course: 'Computer Science',
      academicYear: '3rd Year',
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
      registrationStatus: 'Active',
      createdBy: mockUserId,
    };

    it('10. should validate a complete, valid Student document', async () => {
      const student = new Student(sampleStudentData);
      await expect(student.validate()).resolves.toBeUndefined();

      expect(student.studentId).toBe('STU-2026-001');
      expect(student.fullName).toBe('Alex Mercer');
      expect(student.email).toBe('alex.mercer@example.com');
      expect(student.course).toBe('Computer Science');
      expect(student.skills).toHaveLength(4);
      expect(student.createdBy.toString()).toBe(mockUserId.toString());
    });

    it('11. should reject student creation when mandatory fields are missing', async () => {
      const emptyStudent = new Student({});
      let validationError;

      try {
        await emptyStudent.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.studentId).toBeDefined();
      expect(validationError.errors.fullName).toBeDefined();
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.phone).toBeDefined();
      expect(validationError.errors.dateOfBirth).toBeDefined();
      expect(validationError.errors.course).toBeDefined();
      expect(validationError.errors.academicYear).toBeDefined();
      expect(validationError.errors.createdBy).toBeDefined();
    });

    it('12. should reject malformed student email addresses', async () => {
      const student = new Student({
        ...sampleStudentData,
        email: 'invalid-email-format',
      });

      let validationError;
      try {
        await student.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.email.message).toContain('valid student email address');
    });

    it('13. should reject malformed phone numbers', async () => {
      const student = new Student({
        ...sampleStudentData,
        phone: 'not-a-phone-number',
      });

      let validationError;
      try {
        await student.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.phone).toBeDefined();
      expect(validationError.errors.phone.message).toContain('valid phone number');
    });

    it('14. should strictly reject student creation if createdBy is missing', async () => {
      const studentWithoutCreator = new Student({
        ...sampleStudentData,
        createdBy: undefined,
      });

      let validationError;
      try {
        await studentWithoutCreator.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.createdBy).toBeDefined();
      expect(validationError.errors.createdBy.message).toContain('createdBy) is required');
    });

    it('15. should correctly link Student to User via createdBy ObjectId reference', () => {
      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        name: 'Instructor John',
        email: 'john@example.com',
        password: 'Password123!',
        role: 'Admin',
      });

      const student = new Student({
        ...sampleStudentData,
        createdBy: user._id,
      });

      expect(student.createdBy.equals(user._id)).toBe(true);
      expect(student.createdBy.toString()).toBe(user._id.toString());
    });

    it('16. should verify createdBy schema ref points specifically to User model', () => {
      const createdByPath = Student.schema.path('createdBy');

      expect(createdByPath).toBeDefined();
      expect(createdByPath.instance).toBe('ObjectId');
      expect(createdByPath.options.ref).toBe('User');
      expect(createdByPath.isRequired).toBe(true);
    });
  });
});

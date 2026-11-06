import crypto from 'crypto';
import Student from '../models/Student.js';
import { initialStudents } from '../seed/seedData.js';
import { getDatabaseStatus } from '../config/db.js';

// In-memory persistent collection initialized with sample seed data
let inMemoryStudents = initialStudents.map((s) => ({ ...s }));

/**
 * Generate simulated MongoDB ObjectId (24 hex characters)
 */
const generateObjectId = () => crypto.randomBytes(12).toString('hex');

/**
 * Generate formatted sequential Student ID (e.g. STU-2026-011)
 */
const generateNextStudentId = (currentStudents) => {
  const maxNumber = currentStudents.reduce((max, s) => {
    const match = s.studentId && s.studentId.match(/STU-\d{4}-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);

  const nextNum = String(maxNumber + 1).padStart(3, '0');
  const year = new Date().getFullYear();
  return `STU-${year}-${nextNum}`;
};

export const studentStore = {
  /**
   * Check if running in active MongoDB mode or In-Memory fallback mode
   */
  isMongoActive() {
    return getDatabaseStatus().isConnected;
  },

  /**
   * Retrieve students with search, filters, pagination and sorting
   */
  async findAll({
    search = '',
    course = '',
    academicYear = '',
    status = '',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    if (this.isMongoActive()) {
      const query = {};

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { fullName: regex },
          { email: regex },
          { studentId: regex },
          { course: regex },
          { collegeName: regex },
          { skills: { $in: [regex] } },
        ];
      }

      if (course && course !== 'All') {
        query.course = course;
      }

      if (academicYear && academicYear !== 'All') {
        query.academicYear = academicYear;
      }

      if (status && status !== 'All') {
        query.registrationStatus = status;
      }

      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
      const skip = (parsedPage - 1) * parsedLimit;

      const [students, total] = await Promise.all([
        Student.find(query).sort(sort).skip(skip).limit(parsedLimit).lean(),
        Student.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / parsedLimit) || 1;

      return {
        students,
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
      };
    }

    // --- In-Memory Fallback Implementation ---
    let result = [...inMemoryStudents];

    // Filter by search term
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          (s.studentId && s.studentId.toLowerCase().includes(term)) ||
          s.course.toLowerCase().includes(term) ||
          (s.collegeName && s.collegeName.toLowerCase().includes(term)) ||
          (Array.isArray(s.skills) && s.skills.some((sk) => sk.toLowerCase().includes(term)))
      );
    }

    // Filter by course
    if (course && course !== 'All') {
      result = result.filter((s) => s.course.toLowerCase() === course.toLowerCase());
    }

    // Filter by academic year
    if (academicYear && academicYear !== 'All') {
      result = result.filter((s) => s.academicYear === academicYear);
    }

    // Filter by registration status
    if (status && status !== 'All') {
      result = result.filter(
        (s) => s.registrationStatus.toLowerCase() === status.toLowerCase()
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = result.length;
    const totalPages = Math.ceil(total / parsedLimit) || 1;
    const startIndex = (parsedPage - 1) * parsedLimit;
    const paginatedStudents = result.slice(startIndex, startIndex + parsedLimit);

    return {
      students: paginatedStudents,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages,
    };
  },

  /**
   * Find a single student by Mongo _id or custom studentId
   */
  async findById(id) {
    if (!id || typeof id !== 'string') return null;

    if (this.isMongoActive()) {
      // Try finding by MongoDB _id first if valid hex length
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        const student = await Student.findById(id).lean();
        if (student) return student;
      }
      // Otherwise look by studentId
      return await Student.findOne({ studentId: id.toUpperCase() }).lean();
    }

    // In-memory lookup
    return inMemoryStudents.find(
      (s) => s._id === id || (s.studentId && s.studentId.toUpperCase() === id.toUpperCase())
    ) || null;
  },

  /**
   * Find student by unique email
   */
  async findByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();

    if (this.isMongoActive()) {
      return await Student.findOne({ email: normalized }).lean();
    }

    return inMemoryStudents.find((s) => s.email.toLowerCase() === normalized) || null;
  },

  /**
   * Create a new student
   */
  async create(data) {
    const timestamp = new Date().toISOString();
    const skills = Array.isArray(data.skills)
      ? data.skills
      : typeof data.skills === 'string'
      ? data.skills.split(',').map((sk) => sk.trim()).filter(Boolean)
      : [];

    if (this.isMongoActive()) {
      const studentId = data.studentId || generateNextStudentId(await Student.find({}, 'studentId'));
      const student = new Student({
        ...data,
        studentId,
        email: data.email.trim().toLowerCase(),
        skills,
      });
      const saved = await student.save();
      return saved.toObject();
    }

    // In-memory creation
    const studentId = data.studentId || generateNextStudentId(inMemoryStudents);
    const newStudent = {
      _id: generateObjectId(),
      studentId,
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      dateOfBirth: data.dateOfBirth,
      gender: data.gender || 'Other',
      collegeName: (data.collegeName || 'Cognifyz Institute of Technology').trim(),
      course: data.course.trim(),
      academicYear: data.academicYear,
      skills,
      registrationStatus: data.registrationStatus || 'Active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    inMemoryStudents.unshift(newStudent);
    return { ...newStudent };
  },

  /**
   * Update an existing student record
   */
  async update(id, updateData) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const timestamp = new Date().toISOString();
    const skills = updateData.skills !== undefined
      ? (Array.isArray(updateData.skills)
          ? updateData.skills
          : typeof updateData.skills === 'string'
          ? updateData.skills.split(',').map((sk) => sk.trim()).filter(Boolean)
          : [])
      : existing.skills;

    if (this.isMongoActive()) {
      const updated = await Student.findOneAndUpdate(
        { _id: existing._id },
        {
          ...updateData,
          skills,
          ...(updateData.email ? { email: updateData.email.trim().toLowerCase() } : {}),
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      ).lean();
      return updated;
    }

    // In-memory update
    const index = inMemoryStudents.findIndex((s) => s._id === existing._id);
    if (index === -1) return null;

    const updatedStudent = {
      ...inMemoryStudents[index],
      ...updateData,
      skills,
      ...(updateData.email ? { email: updateData.email.trim().toLowerCase() } : {}),
      updatedAt: timestamp,
    };

    inMemoryStudents[index] = updatedStudent;
    return { ...updatedStudent };
  },

  /**
   * Delete a student record
   */
  async delete(id) {
    const existing = await this.findById(id);
    if (!existing) return null;

    if (this.isMongoActive()) {
      await Student.deleteOne({ _id: existing._id });
      return existing;
    }

    // In-memory deletion
    const index = inMemoryStudents.findIndex((s) => s._id === existing._id);
    if (index === -1) return null;

    const [deleted] = inMemoryStudents.splice(index, 1);
    return deleted;
  },

  /**
   * Aggregate dashboard analytics
   */
  async getDashboardStats() {
    const all = this.isMongoActive()
      ? await Student.find({}).lean()
      : [...inMemoryStudents];

    const totalStudents = all.length;
    const activeStudents = all.filter((s) => s.registrationStatus === 'Active').length;
    const pendingStudents = all.filter((s) => s.registrationStatus === 'Pending').length;
    const graduatedStudents = all.filter((s) => s.registrationStatus === 'Graduated').length;
    const suspendedStudents = all.filter((s) => s.registrationStatus === 'Suspended').length;

    // Course distribution
    const courseMap = {};
    all.forEach((s) => {
      const c = s.course || 'Unassigned';
      courseMap[c] = (courseMap[c] || 0) + 1;
    });
    const courseDistribution = Object.entries(courseMap).map(([course, count]) => ({
      course,
      count,
      percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
    }));

    // Academic Year distribution
    const yearMap = {};
    all.forEach((s) => {
      const y = s.academicYear || 'Unknown';
      yearMap[y] = (yearMap[y] || 0) + 1;
    });
    const academicYearDistribution = Object.entries(yearMap).map(([academicYear, count]) => ({
      academicYear,
      count,
      percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
    }));

    // Recent 5 registrations
    const recentStudents = [...all]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalStudents,
      activeStudents,
      pendingStudents,
      graduatedStudents,
      suspendedStudents,
      totalCourses: Object.keys(courseMap).length,
      courseDistribution,
      academicYearDistribution,
      recentStudents,
      storageMode: this.isMongoActive() ? 'mongodb' : 'in-memory-fallback',
    };
  },

  /**
   * Reset store data to default 10 sample students
   */
  async resetSeedData() {
    inMemoryStudents = initialStudents.map((s) => ({ ...s }));

    if (this.isMongoActive()) {
      await Student.deleteMany({});
      await Student.insertMany(initialStudents);
    }

    return { count: inMemoryStudents.length };
  },
};


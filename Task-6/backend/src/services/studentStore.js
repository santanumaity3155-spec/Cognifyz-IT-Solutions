import mongoose from 'mongoose';
import Student from '../models/Student.js';
import { initialStudents } from '../seed/seedData.js';
import { getDatabaseStatus } from '../config/db.js';

let inMemoryStudents = initialStudents.map((s) => ({ ...s }));

const generateNextStudentId = (studentsList) => {
  const maxNumber = studentsList.reduce((max, s) => {
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

/**
 * Escapes regex special characters to prevent ReDoS and regex syntax errors
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'fullName',
  'studentId',
  'course',
  'registrationStatus',
  'academicYear',
];

export const studentStore = {
  isMongoActive() {
    return getDatabaseStatus().isConnected && mongoose.connection.readyState === 1;
  },

  async findAll({
    search = '',
    course = '',
    academicYear = '',
    status = '',
    createdBy = null,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    if (this.isMongoActive()) {
      const query = {};

      if (createdBy) {
        query.createdBy = createdBy;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const safeRegex = new RegExp(escapeRegex(search.trim()), 'i');
        query.$or = [
          { fullName: safeRegex },
          { email: safeRegex },
          { studentId: safeRegex },
          { course: safeRegex },
          { collegeName: safeRegex },
        ];
      }

      if (course && typeof course === 'string' && course !== 'All') query.course = course;
      if (academicYear && typeof academicYear === 'string' && academicYear !== 'All') query.academicYear = academicYear;
      if (status && typeof status === 'string' && status !== 'All') query.registrationStatus = status;

      const sort = { [safeSortBy]: safeSortOrder === 'asc' ? 1 : -1 };
      const skip = (parsedPage - 1) * parsedLimit;

      const [students, total] = await Promise.all([
        Student.find(query).sort(sort).skip(skip).limit(parsedLimit).populate('createdBy', 'name email role').lean(),
        Student.countDocuments(query),
      ]);

      return {
        students,
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 1,
      };
    }

    // In-memory fallback
    let result = [...inMemoryStudents];

    if (createdBy) {
      result = result.filter((s) => s.createdBy.toString() === createdBy.toString());
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          (s.fullName && s.fullName.toLowerCase().includes(term)) ||
          (s.email && s.email.toLowerCase().includes(term)) ||
          (s.studentId && s.studentId.toLowerCase().includes(term)) ||
          (s.course && s.course.toLowerCase().includes(term)) ||
          (s.collegeName && s.collegeName.toLowerCase().includes(term))
      );
    }

    if (course && typeof course === 'string' && course !== 'All') {
      result = result.filter((s) => s.course.toLowerCase() === course.toLowerCase());
    }
    if (academicYear && typeof academicYear === 'string' && academicYear !== 'All') {
      result = result.filter((s) => s.academicYear === academicYear);
    }
    if (status && typeof status === 'string' && status !== 'All') {
      result = result.filter((s) => s.registrationStatus === status);
    }

    result.sort((a, b) => {
      let valA = a[safeSortBy] ?? '';
      let valB = b[safeSortBy] ?? '';
      if (safeSortBy === 'createdAt' || safeSortBy === 'updatedAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (valA < valB) return safeSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return safeSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = result.length;
    const startIndex = (parsedPage - 1) * parsedLimit;
    const paginated = result.slice(startIndex, startIndex + parsedLimit);

    return {
      students: paginated,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    };
  },

  async findById(id) {
    if (!id) return null;

    if (this.isMongoActive()) {
      if (mongoose.isValidObjectId(id)) {
        const found = await Student.findById(id).populate('createdBy', 'name email role').lean();
        if (found) return found;
      }
      return Student.findOne({ studentId: id.toString().toUpperCase() }).populate('createdBy', 'name email role').lean();
    }

    const idStr = id.toString();
    return (
      inMemoryStudents.find(
        (s) => s._id.toString() === idStr || (s.studentId && s.studentId.toUpperCase() === idStr.toUpperCase())
      ) || null
    );
  },

  async create(data) {
    const timestamp = new Date();
    const studentId = data.studentId || generateNextStudentId(inMemoryStudents);

    if (this.isMongoActive()) {
      const student = new Student({
        ...data,
        studentId,
      });
      await student.save();
      return student.toObject();
    }

    const newStudent = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...data,
      studentId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    inMemoryStudents.unshift(newStudent);
    return newStudent;
  },

  async update(id, updateData) {
    const existing = await this.findById(id);
    if (!existing) return null;

    if (this.isMongoActive()) {
      return Student.findOneAndUpdate(
        { _id: existing._id },
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email role').lean();
    }

    const idx = inMemoryStudents.findIndex((s) => s._id.toString() === existing._id.toString());
    if (idx === -1) return null;

    const updated = {
      ...inMemoryStudents[idx],
      ...updateData,
      updatedAt: new Date(),
    };
    inMemoryStudents[idx] = updated;
    return updated;
  },

  async delete(id) {
    const existing = await this.findById(id);
    if (!existing) return null;

    if (this.isMongoActive()) {
      await Student.deleteOne({ _id: existing._id });
      return existing;
    }

    const idx = inMemoryStudents.findIndex((s) => s._id.toString() === existing._id.toString());
    if (idx === -1) return null;

    const [deleted] = inMemoryStudents.splice(idx, 1);
    return deleted;
  },

  async getDashboardStats({ createdBy = null } = {}) {
    const all = this.isMongoActive()
      ? await Student.find(createdBy ? { createdBy } : {}).lean()
      : inMemoryStudents.filter((s) => (!createdBy ? true : s.createdBy.toString() === createdBy.toString()));

    const totalStudents = all.length;
    const activeStudents = all.filter((s) => s.registrationStatus === 'Active').length;
    const pendingStudents = all.filter((s) => s.registrationStatus === 'Pending').length;
    const graduatedStudents = all.filter((s) => s.registrationStatus === 'Graduated').length;

    const courseMap = {};
    all.forEach((s) => {
      courseMap[s.course] = (courseMap[s.course] || 0) + 1;
    });

    const courseDistribution = Object.entries(courseMap).map(([course, count]) => ({
      course,
      count,
      percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
    }));

    return {
      totalStudents,
      activeStudents,
      pendingStudents,
      graduatedStudents,
      totalCourses: Object.keys(courseMap).length,
      courseDistribution,
      recentStudents: all.slice(0, 5),
    };
  },

  async resetSeedData() {
    inMemoryStudents = initialStudents.map((s) => ({ ...s }));
    if (this.isMongoActive()) {
      await Student.deleteMany({});
      await Student.insertMany(initialStudents);
    }
  },
};

export default studentStore;


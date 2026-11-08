/**
 * Comprehensive Live End-to-End Workflow Verification Script
 * Exercises the live Express server over actual HTTP network sockets.
 */
const { spawn } = require('child_process');
const http = require('http');

const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {}),
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : null;
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw: rawData });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function waitForServer(maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await makeRequest('GET', '/api/health');
      if (res.status === 200) return true;
    } catch {
      // server still starting
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function runLiveVerification() {
  console.log('================================================================');
  console.log(' Phase 11: Live End-to-End Workflow & Network Integration Audit ');
  console.log('================================================================\n');

  console.log(`[Step 1] Spawning live backend process on port ${PORT}...`);
  const serverProcess = spawn('node', ['src/server.js'], {
    cwd: __dirname + '/../..',
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'development' },
    stdio: 'pipe',
  });

  serverProcess.stdout.on('data', (d) => process.stdout.write(`  [server:out] ${d}`));
  serverProcess.stderr.on('data', (d) => process.stderr.write(`  [server:err] ${d}`));

  const isUp = await waitForServer();
  if (!isUp) {
    console.error('❌ Server failed to start within timeout.');
    serverProcess.kill();
    process.exit(1);
  }
  console.log('\n[PASS] Live Express server is up and listening!\n');

  const stepResults = [];

  function recordStep(name, passed, detail) {
    stepResults.push({ name, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark}: ${name} - ${detail}`);
  }

  try {
    // 1. Health check
    const health = await makeRequest('GET', '/api/health');
    recordStep(
      'GET /api/health',
      health.status === 200 && health.body.success === true,
      `Status: ${health.status}, Storage: ${health.body?.database?.mode}`
    );

    // 2. Fetch initial students
    const initialStudents = await makeRequest('GET', '/api/students');
    const initialTotal = initialStudents.body?.total || 0;
    recordStep(
      'GET /api/students',
      initialStudents.status === 200 && initialTotal >= 10,
      `Retrieved ${initialTotal} seeded students with pagination`
    );

    // 3. Initial dashboard stats
    const initialStats = await makeRequest('GET', '/api/dashboard/stats');
    recordStep(
      'GET /api/dashboard/stats',
      initialStats.status === 200 && initialStats.body?.data?.totalStudents === initialTotal,
      `Stats show totalStudents = ${initialStats.body?.data?.totalStudents}, courses = ${initialStats.body?.data?.totalCourses}`
    );

    // 4 & 5. Create new student
    const testStudent = {
      fullName: 'Clara Oswald',
      email: 'clara.oswald@example.com',
      phone: '+1 (555) 987-6543',
      dateOfBirth: '2004-11-23',
      gender: 'Female',
      collegeName: 'Cognifyz Institute of Technology',
      course: 'Data Science',
      academicYear: '2nd Year',
      skills: ['Python', 'SQL', 'TensorFlow'],
      registrationStatus: 'Active',
    };

    const createRes = await makeRequest('POST', '/api/students', testStudent);
    const newId = createRes.body?.data?._id;
    const studentIdCode = createRes.body?.data?.studentId;
    recordStep(
      'POST /api/students (Create Student)',
      createRes.status === 201 && !!newId && !!studentIdCode,
      `Status: ${createRes.status}, Created ID: ${newId}, Code: ${studentIdCode}`
    );

    // 6. Verify student in directory listing
    const afterCreateList = await makeRequest('GET', '/api/students');
    const foundInList = afterCreateList.body?.data?.find((s) => s._id === newId);
    recordStep(
      'Verify Student in Directory (Persistence)',
      Boolean(foundInList) && afterCreateList.body?.total === initialTotal + 1,
      `Directory total updated to ${afterCreateList.body?.total}, record found: ${foundInList?.fullName}`
    );

    // 7. Get student details by ID
    const detailRes = await makeRequest('GET', `/api/students/${newId}`);
    recordStep(
      'GET /api/students/:id (Details)',
      detailRes.status === 200 && detailRes.body?.data?.email === 'clara.oswald@example.com',
      `Retrieved: ${detailRes.body?.data?.fullName} (${detailRes.body?.data?.course})`
    );

    // 8. Update student record
    const updatePayload = {
      skills: ['Python', 'SQL', 'TensorFlow', 'FastAPI', 'Docker'],
      academicYear: '3rd Year',
    };
    const updateRes = await makeRequest('PUT', `/api/students/${newId}`, updatePayload);
    recordStep(
      'PUT /api/students/:id (Edit Student)',
      updateRes.status === 200 &&
        updateRes.body?.data?.academicYear === '3rd Year' &&
        updateRes.body?.data?.skills?.includes('Docker'),
      `Updated year to 3rd Year, skills count = ${updateRes.body?.data?.skills?.length}`
    );

    // 9. Search for student by query
    const searchRes = await makeRequest('GET', '/api/students?search=Clara');
    recordStep(
      'GET /api/students?search=Clara (Search)',
      searchRes.status === 200 && searchRes.body?.data?.some((s) => s._id === newId),
      `Found ${searchRes.body?.data?.length} search matches`
    );

    // 10. Filter by course, year, and status
    const filterRes = await makeRequest(
      'GET',
      '/api/students?course=Data+Science&academicYear=3rd+Year&status=Active'
    );
    recordStep(
      'GET /api/students?course=...&academicYear=... (Filters)',
      filterRes.status === 200 && filterRes.body?.data?.some((s) => s._id === newId),
      `Filtered matches returned: ${filterRes.body?.data?.length}`
    );

    // 11. Dashboard stats updated
    const statsAfterAdd = await makeRequest('GET', '/api/dashboard/stats');
    recordStep(
      'GET /api/dashboard/stats (Dynamic Aggregation)',
      statsAfterAdd.status === 200 &&
        statsAfterAdd.body?.data?.totalStudents === initialTotal + 1,
      `Total students dynamically incremented to ${statsAfterAdd.body?.data?.totalStudents}`
    );

    // 12. Delete student
    const deleteRes = await makeRequest('DELETE', `/api/students/${newId}`);
    recordStep(
      'DELETE /api/students/:id (Delete Record)',
      deleteRes.status === 200 && deleteRes.body?.success === true,
      `Status: ${deleteRes.status}, Message: ${deleteRes.body?.message}`
    );

    // 13. Verify 404 for deleted student
    const verifyDelete = await makeRequest('GET', `/api/students/${newId}`);
    recordStep(
      'GET /api/students/:id after deletion (404 Not Found)',
      verifyDelete.status === 404,
      `Status: ${verifyDelete.status} (record confirmed deleted)`
    );

    // 14. Verify dashboard stats decremented
    const statsAfterDelete = await makeRequest('GET', '/api/dashboard/stats');
    recordStep(
      'GET /api/dashboard/stats after deletion',
      statsAfterDelete.status === 200 &&
        statsAfterDelete.body?.data?.totalStudents === initialTotal,
      `Total students returned to initial baseline: ${statsAfterDelete.body?.data?.totalStudents}`
    );

    // 15. Validation Error: Duplicate Email
    const dupRes = await makeRequest('POST', '/api/students', {
      ...testStudent,
      email: 'alex.rivera@example.com', // already exists in seeds
    });
    recordStep(
      'POST /api/students duplicate email prevention (409 Conflict)',
      dupRes.status === 409 && dupRes.body?.success === false,
      `Status: ${dupRes.status}, Error: ${dupRes.body?.message}`
    );

    // 16. Validation Error: Missing Required Fields
    const missingRes = await makeRequest('POST', '/api/students', {
      fullName: 'A', // too short
      email: 'not-an-email',
    });
    recordStep(
      'POST /api/students schema validation rejection (400 Bad Request)',
      missingRes.status === 400 && missingRes.body?.errors?.length >= 2,
      `Status: ${missingRes.status}, Total field errors: ${missingRes.body?.errors?.length}`
    );

    // 17. Non-existent ID handling
    const nonExistentIdRes = await makeRequest('GET', '/api/students/NONEXISTENT-ID-999');
    recordStep(
      'GET /api/students/:id non-existent ID rejection (404 Not Found)',
      nonExistentIdRes.status === 404 && nonExistentIdRes.body?.error === 'STUDENT_NOT_FOUND',
      `Status: ${nonExistentIdRes.status}, Error: ${nonExistentIdRes.body?.error}`
    );

    // 18. Invalid blank ID handling
    const invalidBlankIdRes = await makeRequest('GET', '/api/students/%20');
    recordStep(
      'GET /api/students/:id blank ID rejection (400 Bad Request)',
      invalidBlankIdRes.status === 400 && invalidBlankIdRes.body?.error === 'INVALID_ID',
      `Status: ${invalidBlankIdRes.status}, Error: ${invalidBlankIdRes.body?.error}`
    );
  } finally {
    console.log('\n[Teardown] Shutting down live server...');
    serverProcess.kill('SIGINT');
  }

  const allPassed = stepResults.every((s) => s.passed);
  console.log('\n================================================================');
  console.log(` Summary: ${stepResults.filter((s) => s.passed).length}/${stepResults.length} Live E2E Steps Passed`);
  console.log(` Overall Result: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
  console.log('================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runLiveVerification().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

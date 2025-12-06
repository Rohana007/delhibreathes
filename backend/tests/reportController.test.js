/**
 * Tests for report submission with user name and email
 * Run with: npm test -- reportController.test.js
 */

const mongoose = require('mongoose');
const Report = require('../src/models/Report');
const User = require('../src/models/User');
const { submitReport } = require('../src/controllers/reportController');
const { ensureConnectionAndQuery } = require('../src/utils/mongoHelper');

// Mock request and response objects
const createMockReq = (overrides = {}) => ({
  body: {
    category: 'pollution',
    description: 'Test pollution report description with enough characters',
    location: 'Test Location, Delhi',
    ...overrides.body,
  },
  userId: 'test-user-id',
  userEmail: 'test@example.com',
  file: null,
  ...overrides,
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Report Submission with User Profile', () => {
  let testUserId;
  let testUser;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/delhi_breathes_test';
    await mongoose.connect(mongoUri);
    
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      passwordHash: 'test-hash',
    });
    testUserId = testUser._id.toString();
  });

  afterAll(async () => {
    // Cleanup
    await Report.deleteMany({ userId: testUserId });
    await User.deleteMany({ _id: testUserId });
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear reports before each test
    await Report.deleteMany({ userId: testUserId });
  });

  test('should save report with user email and name from JWT', async () => {
    const req = createMockReq({
      userId: testUserId,
      userEmail: 'testuser@example.com',
    });
    const res = createMockRes();

    await submitReport(req, res);

    expect(res.json).toHaveBeenCalled();
    const savedReport = await Report.findOne({ userId: testUserId });
    expect(savedReport).toBeTruthy();
    expect(savedReport.email).toBe('testuser@example.com');
    expect(savedReport.name).toBe('Test User');
  });

  test('should fetch user name and email from User model if missing from JWT', async () => {
    const req = createMockReq({
      userId: testUserId,
      userEmail: null, // Missing from JWT
    });
    const res = createMockRes();

    await submitReport(req, res);

    expect(res.json).toHaveBeenCalled();
    const savedReport = await Report.findOne({ userId: testUserId });
    expect(savedReport).toBeTruthy();
    expect(savedReport.email).toBe('testuser@example.com');
    expect(savedReport.name).toBe('Test User');
  });

  test('should prevent duplicate submissions with idempotency_key', async () => {
    const idempotencyKey = 'test-idempotency-key-123';
    
    const req1 = createMockReq({
      userId: testUserId,
      body: {
        category: 'pollution',
        description: 'Test pollution report description with enough characters',
        location: 'Test Location, Delhi',
        idempotency_key: idempotencyKey,
      },
    });
    const res1 = createMockRes();
    
    const req2 = createMockReq({
      userId: testUserId,
      body: {
        category: 'pollution',
        description: 'Test pollution report description with enough characters',
        location: 'Test Location, Delhi',
        idempotency_key: idempotencyKey,
      },
    });
    const res2 = createMockRes();

    await submitReport(req1, res1);
    await submitReport(req2, res2);

    // Should only create one report
    const reports = await Report.find({ idempotency_key: idempotencyKey });
    expect(reports.length).toBe(1);
    
    // Second response should indicate duplicate
    expect(res2.json).toHaveBeenCalledWith(
      expect.objectContaining({ duplicate: true })
    );
  });

  test('should use fallback values if user not found', async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const req = createMockReq({
      userId: nonExistentUserId,
      userEmail: null,
    });
    const res = createMockRes();

    await submitReport(req, res);

    expect(res.json).toHaveBeenCalled();
    const savedReport = await Report.findOne({ userId: nonExistentUserId });
    expect(savedReport).toBeTruthy();
    expect(savedReport.email).toBe('No Email Available');
    expect(savedReport.name).toBe('Unknown');
  });
});


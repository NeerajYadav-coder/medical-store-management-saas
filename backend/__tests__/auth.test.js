import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import MedicalStore from '../models/MedicalStore.js';
import RefreshToken from '../models/RefreshToken.js';
import OTP from '../models/OTP.js';
import { signup, login, refreshToken, changePassword, resetPassword, checkEmailUniqueness } from '../controllers/auth.controller.js';
import env from '../config/env.js';

let mongoServer;

const makeMockReq = (body = {}, cookies = {}, headers = {}, params = {}, query = {}) => ({
  body,
  cookies,
  headers,
  params,
  query,
  ip: '127.0.0.1',
  get: (name) => headers[name.toLowerCase()] || 'test-agent',
});

const makeMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  res.cookie = (name, val, options) => {
    res.cookies = res.cookies || {};
    res.cookies[name] = { val, options };
    return res;
  };
  res.clearCookie = (name) => {
    res.clearedCookies = res.clearedCookies || [];
    res.clearedCookies.push(name);
    return res;
  };
  return res;
};

const makeMockNext = () => (err) => {
  if (err) throw err;
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

describe('Authentication & Session Lifecycle Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Ensure JWT Secret is present for testing
    if (!env.JWT_ACCESS_SECRET) {
      env.JWT_ACCESS_SECRET = 'supersecretkeyforunittestingaccess';
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await MedicalStore.deleteMany({});
    await RefreshToken.deleteMany({});
    await OTP.deleteMany({});
  });

  it('should register a store and owner, hashing credentials and issuing tokens', async () => {
    const ownerEmail = 'owner@example.com';
    const ownerPhone = '+1234567890';

    // Mock the OTP states in DB
    await OTP.create([
      { destination: ownerEmail, type: 'email', code: 'hashed', purpose: 'signup', isVerified: true, expiresAt: new Date(Date.now() + 100000) },
    ]);

    const req = makeMockReq({
      storeName: 'Test Store',
      ownerName: 'Test Owner',
      storePhone: '+1234567891',
      storeEmail: 'store@example.com',
      address: '123 Main St',
      drugLicenseNumber: 'DL-123456',
      ownerEmail,
      ownerPhone,
      password: 'Password123!',
    });

    const res = makeMockRes();
    await signup(req, res, makeMockNext());

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    // Verify OTP records were deleted
    const otps = await OTP.find({ destination: ownerEmail });
    expect(otps.length).toBe(0);

    // Verify refresh token stored in DB
    const hashed = hashToken(res.body.refreshToken);
    const dbToken = await RefreshToken.findOne({ tokenHash: hashed });
    expect(dbToken).toBeDefined();
    expect(dbToken.userId.toString()).toBe(res.body.user.id.toString());
  });

  it('should authenticate user and return rotated access and refresh tokens', async () => {
    const store = await MedicalStore.create({
      name: 'Store',
      ownerName: 'Owner',
      phone: '+123',
      email: 's@e.com',
      address: 'Addr',
      drugLicenseNumber: 'DL',
    });

    const user = await User.create({
      name: 'Owner',
      email: 'user@example.com',
      phone: '+12345',
      passwordHash: 'Password123!',
      role: 'OWNER',
      medicalStoreId: store._id,
    });

    const req = makeMockReq({
      email: 'user@example.com',
      password: 'Password123!',
    });

    const res = makeMockRes();
    await login(req, res, makeMockNext());

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.cookies.refreshToken.val).toBe(res.body.refreshToken);
  });

  it('should rotate refresh token and reject reuse (Replay Attack Defense)', async () => {
    const store = await MedicalStore.create({ name: 'S', ownerName: 'O', phone: '1', email: 's@s.com', address: 'A', drugLicenseNumber: 'D' });
    const user = await User.create({ name: 'O', email: 'user@e.com', phone: '12', passwordHash: 'P', role: 'OWNER', medicalStoreId: store._id });

    // Generate initial refresh token
    const firstToken = crypto.randomBytes(40).toString('hex');
    const firstHash = hashToken(firstToken);
    await RefreshToken.create({
      userId: user._id,
      tokenHash: firstHash,
      expiresAt: new Date(Date.now() + 1000000),
    });

    // 1️⃣ Rotate token
    const refreshReq = makeMockReq({}, { refreshToken: firstToken });
    const refreshRes = makeMockRes();
    await refreshToken(refreshReq, refreshRes, makeMockNext());

    expect(refreshRes.statusCode).toBe(200);
    const secondToken = refreshRes.body.refreshToken;
    expect(secondToken).not.toBe(firstToken);

    // Verify first token is marked as revoked/replaced
    const replacedToken = await RefreshToken.findOne({ tokenHash: firstHash });
    expect(replacedToken.isRevoked).toBe(true);
    expect(replacedToken.replacedByTokenHash).toBe(hashToken(secondToken));

    // 2️⃣ Attempt to reuse first token (hijack simulation)
    const reuseReq = makeMockReq({}, { refreshToken: firstToken });
    const reuseRes = makeMockRes();
    await refreshToken(reuseReq, reuseRes, makeMockNext());

    expect(reuseRes.statusCode).toBe(401);
    expect(reuseRes.body.message).toContain('Suspicious session activity');

    // All active sessions for this user should be invalidated
    const activeTokens = await RefreshToken.find({ userId: user._id });
    expect(activeTokens.length).toBe(0);

    // Token version of user should be incremented
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.tokenVersion).toBe(1);
  });

  it('should invalidate active tokens when user changes password', async () => {
    const store = await MedicalStore.create({ name: 'S', ownerName: 'O', phone: '1', email: 's@s.com', address: 'A', drugLicenseNumber: 'D' });
    const user = await User.create({ name: 'O', email: 'user@e.com', phone: '12', passwordHash: 'P123', role: 'OWNER', medicalStoreId: store._id });

    // Store refresh token
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken('r_token'),
      expiresAt: new Date(Date.now() + 1000000),
    });

    const req = makeMockReq({
      currentPassword: 'P123',
      newPassword: 'NewPassword123!',
    });
    // Attach auth user context
    req.user = user;

    const res = makeMockRes();
    await changePassword(req, res, makeMockNext());

    expect(res.statusCode).toBe(200);

    // Refresh token should be deleted
    const tokens = await RefreshToken.find({ userId: user._id });
    expect(tokens.length).toBe(0);

    // User token version should be incremented
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.tokenVersion).toBe(1);
  });

  it('should invalidate active tokens when user resets password via token', async () => {
    const store = await MedicalStore.create({ name: 'S', ownerName: 'O', phone: '1', email: 's@s.com', address: 'A', drugLicenseNumber: 'D' });
    const resetToken = 'reset_token_raw';
    const resetHash = hashToken(resetToken);

    const user = await User.create({
      name: 'O',
      email: 'user@e.com',
      phone: '12',
      passwordHash: 'P123',
      role: 'OWNER',
      medicalStoreId: store._id,
      passwordResetToken: resetHash,
      passwordResetExpires: new Date(Date.now() + 600000), // 10 mins future
    });

    // Store refresh token
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken('r_token'),
      expiresAt: new Date(Date.now() + 1000000),
    });

    const req = makeMockReq({
      token: resetToken,
      newPassword: 'NewPassword123!',
    });

    const res = makeMockRes();
    await resetPassword(req, res, makeMockNext());

    expect(res.statusCode).toBe(200);

    // Verify database cleanups
    const tokens = await RefreshToken.find({ userId: user._id });
    expect(tokens.length).toBe(0);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.passwordResetToken).toBeNull();
    expect(updatedUser.passwordResetExpires).toBeNull();
    expect(updatedUser.tokenVersion).toBe(1);
  });

  describe('checkEmailUniqueness', () => {
    it('should return available: true when checking a non-existent email', async () => {
      const req = makeMockReq({ email: 'newemail@example.com', type: 'store' });
      const res = makeMockRes();
      await checkEmailUniqueness(req, res, makeMockNext());

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.available).toBe(true);
    });

    it('should return available: false when checking an existing store email', async () => {
      await MedicalStore.create({
        name: 'Store X',
        ownerName: 'Owner X',
        phone: '+1234567890',
        email: 'existingshop@example.com',
        address: '123 Main St',
        drugLicenseNumber: 'DL-X12345',
      });

      const req = makeMockReq({ email: 'existingshop@example.com', type: 'store' });
      const res = makeMockRes();
      await checkEmailUniqueness(req, res, makeMockNext());

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.available).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    it('should return available: false when checking an existing owner email', async () => {
      const store = await MedicalStore.create({
        name: 'Store Y',
        ownerName: 'Owner Y',
        phone: '+1234567891',
        email: 'store-y@example.com',
        address: '123 Main St',
        drugLicenseNumber: 'DL-Y12345',
      });

      await User.create({
        name: 'Owner Y',
        email: 'existingowner@example.com',
        phone: '+1234567892',
        passwordHash: 'Password123!',
        role: 'OWNER',
        medicalStoreId: store._id,
      });

      const req = makeMockReq({ email: 'existingowner@example.com', type: 'owner' });
      const res = makeMockRes();
      await checkEmailUniqueness(req, res, makeMockNext());

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.available).toBe(false);
      expect(res.body.message).toContain('already registered');
    });
  });
});

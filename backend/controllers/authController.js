import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { verifyFirebaseToken, createCustomToken } from '../config/firebase.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';
import { generateToken, verifyToken, generateEmailVerificationToken, generatePasswordResetToken } from '../utils/tokenUtils.js';
import logger from '../utils/logger.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    sportsInterests,
    location
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { phone }]
  });

  if (existingUser) {
    res.status(400);
    throw new Error('User with this email or phone already exists');
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    password,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    gender,
    sportsInterests: sportsInterests || [],
    location: location || {}
  });

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();

  // Send verification email
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Welcome to CSE471 Sports Platform - Verify Your Email',
      template: 'emailVerification',
      data: {
        name: user.fullName,
        verificationUrl
      }
    });
  } catch (error) {
    logger.error(`Email sending failed: ${error.message}`);
  }

  // Generate JWT token
  const token = user.generateToken();

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for verification.',
    data: {
      user: user.toProfileJSON(),
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if account is locked
  if (user.isAccountLocked) {
    res.status(423);
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }

  // Check if account is active
  if (!user.isActive) {
    res.status(403);
    throw new Error('Account is deactivated. Please contact support.');
  }

  // Check password
  const isPasswordValid = await user.matchPassword(password);

  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();
  await user.updateLastLogin();

  // Generate JWT token
  const tokenExpiry = rememberMe ? '30d' : '24h';
  const token = jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: tokenExpiry }
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toProfileJSON(),
      token
    }
  });
});

// @desc    Login with Firebase
// @route   POST /api/auth/firebase-login
// @access  Public
export const loginWithFirebase = asyncHandler(async (req, res) => {
  const { firebaseToken, userData } = req.body;

  try {
    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(firebaseToken);
    
    // Find or create user
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      // Create new user from Firebase data
      user = await User.create({
        firstName: userData.firstName || decodedToken.name?.split(' ')[0] || 'User',
        lastName: userData.lastName || decodedToken.name?.split(' ').slice(1).join(' ') || '',
        email: decodedToken.email,
        phone: userData.phone || decodedToken.phone_number || '',
        firebaseUid: decodedToken.uid,
        isVerified: decodedToken.email_verified || false,
        avatar: {
          url: decodedToken.picture || userData.photoURL || ''
        }
      });
    } else {
      // Update last login
      await user.updateLastLogin();
    }

    // Generate JWT token
    const token = user.generateToken();

    res.json({
      success: true,
      message: 'Firebase login successful',
      data: {
        user: user.toProfileJSON(),
        token
      }
    });

  } catch (error) {
    logger.error(`Firebase login error: ${error.message}`);
    res.status(401);
    throw new Error('Firebase authentication failed');
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = asyncHandler(async (req, res) => {
  // In a more sophisticated setup, you might maintain a blacklist of tokens
  // For now, we'll just return success (token will be removed on client side)
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('stats.favoriteFields', 'name location images')
    .populate('stats.joinedTeams', 'name logo');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: {
      user: user.toProfileJSON()
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    bio,
    sportsInterests,
    location,
    socialLinks,
    preferences
  } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
  if (gender) user.gender = gender;
  if (bio !== undefined) user.bio = bio;
  if (sportsInterests) user.sportsInterests = sportsInterests;
  if (location) user.location = { ...user.location, ...location };
  if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  const updatedUser = await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser.toProfileJSON()
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check current password
  const isCurrentPasswordValid = await user.matchPassword(currentPassword);

  if (!isCurrentPasswordValid) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    res.status(404);
    throw new Error('User not found with this email');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  // Send reset email
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - CSE471 Sports Platform',
      template: 'passwordReset',
      data: {
        name: user.fullName,
        resetUrl
      }
    });

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.error(`Password reset email failed: ${error.message}`);
    res.status(500);
    throw new Error('Email could not be sent');
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash token to compare with database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.json({
    success: true,
    message: 'Password reset successful'
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Hash token to compare with database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification token');
  }

  // Verify user
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;

  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
export const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error('Email is already verified');
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  await user.save();

  // Send verification email
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Email Verification - CSE471 Sports Platform',
      template: 'emailVerification',
      data: {
        name: user.fullName,
        verificationUrl
      }
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    logger.error(`Verification email failed: ${error.message}`);
    res.status(500);
    throw new Error('Verification email could not be sent');
  }
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    res.status(401);
    throw new Error('Refresh token is required');
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    // Generate new token
    const newToken = user.generateToken();

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
});

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password, confirmDeletion } = req.body;

  if (!confirmDeletion || confirmDeletion !== 'DELETE_MY_ACCOUNT') {
    res.status(400);
    throw new Error('Please confirm account deletion');
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify password for security
  if (user.password) {
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      res.status(400);
      throw new Error('Invalid password');
    }
  }

  // Soft delete by deactivating account
  user.isActive = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  user.phone = `deleted_${Date.now()}_${user.phone}`;
  
  await user.save();

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

// Additional controller functions would be implemented here...
// Including: linkFirebaseAccount, unlinkFirebaseAccount, twoFactorAuth, etc.

export default {
  registerUser,
  loginUser,
  loginWithFirebase,
  logoutUser,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  refreshToken,
  deleteAccount
};